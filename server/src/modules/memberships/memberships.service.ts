import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../utils/pagination';
import {
  CreateMembershipInput,
  UpdateMembershipStatusInput,
  ExtendMembershipInput,
  MembershipQuery,
  MembershipPaymentInput,
  AvailMembershipInput,
} from './memberships.validation';

const customerInclude = {
  customer: {
    include: {
      user: {
        select: {
          id: true,
          email: true,
          phone: true,
          role: true,
          status: true,
        },
      },
    },
  },
};

export class MembershipService {
  async generateCode(): Promise<string> {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    let exists: boolean;

    do {
      let suffix = '';
      for (let i = 0; i < 6; i++) {
        suffix += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      code = `SOUVARI-VIP-${suffix}`;

      const existing = await prisma.memberships.findUnique({ where: { code } });
      exists = !!existing;
    } while (exists);

    return code;
  }

  async list(query: MembershipQuery): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);
    const { status, customer_id, search } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (customer_id) {
      where.customer_id = customer_id;
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { notes: { contains: search } },
        {
          customer: {
            OR: [
              { first_name: { contains: search } },
              { last_name: { contains: search } },
              { user: { email: { contains: search } } },
            ],
          },
        },
      ];
    }

    const [memberships, total] = await Promise.all([
      prisma.memberships.findMany({
        where,
        include: {
          customer: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  phone: true,
                  role: true,
                  status: true,
                },
              },
            },
          },
          plan: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.memberships.count({ where }),
    ]);

    return createPaginatedResult(memberships, total, { page, limit, skip });
  }

  async getById(id: number) {
    const membership = await prisma.memberships.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
              },
            },
          },
        },
        plan: true,
        loyalty_progress: true,
        monthly_perks: {
          orderBy: { year_month: 'desc' },
        },
        gifts: true,
      },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    return membership;
  }

  async getByCustomerId(customerId: number) {
    const membership = await prisma.memberships.findFirst({
      where: {
        customer_id: customerId,
        status: 'active',
      },
      include: {
        plan: {
          include: {
            benefits: {
              where: { is_active: true },
              orderBy: { sort_order: 'asc' },
            },
          },
        },
        loyalty_progress: true,
        monthly_perks: {
          orderBy: { year_month: 'desc' },
        },
        gifts: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return membership;
  }

  async getByCode(code: string) {
    const membership = await prisma.memberships.findUnique({
      where: { code },
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
              },
            },
          },
        },
        plan: true,
      },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    return membership;
  }

  async availPlan(userId: number, data: AvailMembershipInput) {
    const customer = await prisma.customers.findUnique({
      where: { user_id: userId },
    });

    if (!customer) {
      throw new AppError('Customer profile not found', 404);
    }

    const membership = await this.create({ customer_id: customer.id, ...data });

    // If fully paid, it's already active; otherwise stays pending
    if (membership.status === 'pending' && membership.payment_status === 'paid') {
      return this.activate(membership.id);
    }
    return membership;
  }

  private async activate(id: number) {
    return prisma.memberships.update({
      where: { id },
      data: { status: 'active' },
      include: {
        customer: {
          include: {
            user: {
              select: { id: true, email: true, phone: true, role: true, status: true },
            },
          },
        },
        plan: true,
      },
    });
  }

  async create(data: CreateMembershipInput, userId?: number) {
    const customer = await prisma.customers.findUnique({
      where: { id: data.customer_id },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const plan = await prisma.membership_plans.findUnique({
      where: { id: data.plan_id },
    });

    if (!plan || !plan.is_active) {
      throw new AppError('Membership plan not found or inactive', 404);
    }

    const existingActive = await prisma.memberships.findFirst({
      where: {
        customer_id: data.customer_id,
        status: { in: ['active', 'pending'] },
      },
    });

    if (existingActive) {
      throw new AppError('Customer already has an active or pending membership', 409);
    }

    const code = await this.generateCode();
    const now = new Date();
    const endDate = new Date(now);
    endDate.setMonth(endDate.getMonth() + plan.duration_months);

    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    // Determine price: use promo_price if available, otherwise regular_price
    const planPrice = Number(plan.promo_price ?? plan.regular_price ?? 0);
    const amountPaid = data.amount_paid ?? 0;
    const paymentMethod = data.payment_method ?? 'cash';
    const paymentType = data.payment_type ?? (amountPaid >= planPrice ? 'FULL' : 'DOWN_PAYMENT');

    // Compute payment status and membership status
    let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
    let membershipStatus: 'pending' | 'active' = 'pending';
    let balance = planPrice - amountPaid;

    if (amountPaid >= planPrice) {
      paymentStatus = 'paid';
      membershipStatus = 'active';
      balance = 0;
    } else if (amountPaid > 0) {
      paymentStatus = 'partial';
      membershipStatus = 'pending';
    } else {
      paymentStatus = 'pending';
      membershipStatus = 'pending';
    }

    const membership = await prisma.$transaction(async (tx) => {
      const newMembership = await tx.memberships.create({
        data: {
          customer_id: data.customer_id,
          plan_id: data.plan_id,
          code,
          status: membershipStatus,
          start_date: now,
          end_date: endDate,
          price: planPrice,
          amount_paid: amountPaid,
          balance,
          payment_status: paymentStatus,
          notes: data.notes ?? null,
        },
        include: {
          customer: {
            include: {
              user: {
                select: {
                  id: true,
                  email: true,
                  phone: true,
                  role: true,
                  status: true,
                },
              },
            },
          },
          plan: true,
        },
      });

      // Record initial payment if any
      if (amountPaid > 0) {
        await tx.membership_payments.create({
          data: {
            membership_id: newMembership.id,
            amount: amountPaid,
            payment_method: paymentMethod,
            payment_type: paymentType as any,
            installment_no: paymentType === 'INSTALLMENT' ? 1 : null,
            received_by: userId ?? null,
            notes: data.notes ?? `Initial ${paymentType.toLowerCase().replace('_', ' ')} payment`,
          },
        });
      }

      await tx.loyalty_progress.create({
        data: {
          membership_id: newMembership.id,
          qualifying_spend: 0,
          total_spend: 0,
          highest_reward_pct: 0,
        },
      });

      await tx.monthly_perks.create({
        data: {
          membership_id: newMembership.id,
          year_month: currentYearMonth,
          status: 'available',
        },
      });

      return newMembership;
    });

    return membership;
  }

  async updateStatus(id: number, status: string, reason?: string | null) {
    const existing = await prisma.memberships.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Membership not found', 404);
    }

    const membership = await prisma.memberships.update({
      where: { id },
      data: { status: status as any },
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
                role: true,
                status: true,
              },
            },
          },
        },
        plan: true,
      },
    });

    if (reason) {
      await prisma.membership_activity_logs.create({
        data: {
          membership_id: id,
          action: `status_changed_to_${status}`,
          details: JSON.stringify({ reason, old_status: existing.status, new_status: status }),
          performed_by: null,
        },
      });
    }

    return membership;
  }

  async extend(id: number, months: number, reason?: string | null, payment_method?: string, payment_type?: string, amount_paid?: number) {
    const existing = await prisma.memberships.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Membership not found', 404);
    }

    if (existing.status === 'cancelled' || existing.status === 'expired') {
      throw new AppError('Cannot extend a cancelled or expired membership', 400);
    }

    const newEndDate = new Date(existing.end_date);
    newEndDate.setMonth(newEndDate.getMonth() + months);

    // Handle extension payment if provided
    const plan = await prisma.membership_plans.findUnique({ where: { id: existing.plan_id } });
    const extensionPrice = Number(plan?.promo_price ?? plan?.regular_price ?? 0) * (months / (plan?.duration_months ?? 1));
    const paid = amount_paid ?? 0;

    let newAmountPaid = Number(existing.amount_paid) + paid;
    let newBalance = Number(existing.price ?? 0) + extensionPrice - newAmountPaid;
    let newPaymentStatus = existing.payment_status;
    let newMembershipStatus = existing.status;

    if (newAmountPaid >= Number(existing.price ?? 0) + extensionPrice) {
      newPaymentStatus = 'paid';
      newMembershipStatus = 'active';
      newBalance = 0;
    } else if (newAmountPaid > 0) {
      newPaymentStatus = 'partial';
    }

    const membership = await prisma.$transaction(async (tx) => {
      const updated = await tx.memberships.update({
        where: { id },
        data: {
          end_date: newEndDate,
          price: Number(existing.price ?? 0) + extensionPrice,
          amount_paid: newAmountPaid,
          balance: newBalance,
          payment_status: newPaymentStatus,
          status: newMembershipStatus,
        },
        include: {
          customer: {
            include: {
              user: {
                select: { id: true, email: true, phone: true, role: true, status: true },
              },
            },
          },
          plan: true,
        },
      });

      if (paid > 0) {
        await tx.membership_payments.create({
          data: {
            membership_id: id,
            amount: paid,
            payment_method: (payment_method as any) ?? 'cash',
            payment_type: (payment_type as any) ?? 'FULL',
            installment_no: null,
            notes: reason ?? `Extension payment (${months} months)`,
          },
        });
      }

      await tx.membership_activity_logs.create({
        data: {
          membership_id: id,
          action: 'extended',
          details: JSON.stringify({
            months_added: months,
            old_end_date: existing.end_date,
            new_end_date: newEndDate,
            reason: reason ?? null,
            payment: paid > 0 ? { amount: paid, method: payment_method } : null,
          }),
          performed_by: null,
        },
      });

      return updated;
    });

    return membership;
  }

  async validateCode(code: string) {
    const membership = await prisma.memberships.findUnique({
      where: { code },
      include: {
        customer: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        plan: true,
      },
    });

    if (!membership) {
      throw new AppError('Membership code not found', 404);
    }

    if (membership.status !== 'active') {
      throw new AppError('Membership is not active', 400);
    }

    if (new Date(membership.end_date) < new Date()) {
      throw new AppError('Membership has expired', 400);
    }

    return membership;
  }

  async recordPayment(membershipId: number, data: MembershipPaymentInput, userId?: number) {
    const membership = await prisma.memberships.findUnique({
      where: { id: membershipId },
      include: { plan: true },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    const newAmountPaid = Number(membership.amount_paid) + data.amount;
    const newBalance = Number(membership.price ?? 0) - newAmountPaid;

    let newPaymentStatus = membership.payment_status;
    let newMembershipStatus = membership.status;

    if (newAmountPaid >= Number(membership.price ?? 0)) {
      newPaymentStatus = 'paid';
      newMembershipStatus = 'active';
    } else if (newAmountPaid > 0) {
      newPaymentStatus = 'partial';
    }

    return prisma.$transaction(async (tx) => {
      const payment = await tx.membership_payments.create({
        data: {
          membership_id: membershipId,
          amount: data.amount,
          payment_method: data.payment_method,
          payment_type: data.payment_type as any,
          installment_no: data.installment_no ?? null,
          received_by: userId ?? null,
          notes: data.notes ?? null,
        },
      });

      const updatedMembership = await tx.memberships.update({
        where: { id: membershipId },
        data: {
          amount_paid: newAmountPaid,
          balance: newBalance,
          payment_status: newPaymentStatus,
          status: newMembershipStatus,
        },
      });

      if (newMembershipStatus === 'active' && membership.status !== 'active') {
        await tx.membership_activity_logs.create({
          data: {
            membership_id: membershipId,
            action: 'activated_via_payment',
            details: JSON.stringify({ fully_paid: true }),
            performed_by: userId ?? null,
          },
        });
      }

      return { payment, membership: updatedMembership };
    });
  }

  async listPayments(membershipId: number) {
    return prisma.membership_payments.findMany({
      where: { membership_id: membershipId },
      orderBy: { created_at: 'desc' },
      include: {
        receiver: {
          select: { id: true, first_name: true, last_name: true },
        },
      },
    });
  }
}

export const membershipService = new MembershipService();
