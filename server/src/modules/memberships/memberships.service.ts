import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { notificationDispatch } from '../../services/notification-dispatch.service';
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

const overdueInclude = {
  plan: true,
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
    await this.processOverdueMemberships(false);

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
    await this.processOverdueMemberships(false);

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
        payments: {
          orderBy: { created_at: 'desc' },
        },
      },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    return membership;
  }

  async getByCustomerId(customerId: number) {
    await this.processOverdueMemberships(false);

    const membership = await prisma.memberships.findFirst({
      where: {
        customer_id: customerId,
        status: { not: 'cancelled' },
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
      include: customerInclude,
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

    return membership;
  }

  private async activate(id: number) {
    return prisma.memberships.update({
      where: { id },
      data: { status: 'active' },
      include: customerInclude,
    });
  }

  private resolveStaffId(userId: number): Promise<number | null> {
    return prisma.staff
      .findFirst({
        where: { user_id: userId, deleted_at: null },
        select: { id: true },
      })
      .then((staff) => staff?.id ?? null)
      .catch(() => null);
  }

  async ensureOwnership(membershipId: number, role: string, userId: number) {
    if (role !== 'customer') return;

    const membership = await prisma.memberships.findUnique({
      where: { id: membershipId },
      select: { customer_id: true },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    const customer = await prisma.customers.findUnique({
      where: { user_id: userId },
    });

    if (!customer || membership.customer_id !== customer.id) {
      throw new AppError('You can only view your own membership', 403);
    }
  }

  async create(data: CreateMembershipInput, userId?: number) {
    const customer = await prisma.customers.findUnique({
      where: { id: data.customer_id },
      include: {
        user: {
          select: {
            id: true,
            phone: true,
            email: true,
          },
        },
      },
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

    // Compute payment status and membership status.
    // A downpayment activates the membership immediately but keeps a balance
    // which must be settled by down_payment_due_date or the membership fails.
    let paymentStatus: 'pending' | 'partial' | 'paid' = 'pending';
    let membershipStatus: 'pending' | 'active' = 'pending';
    let balance = planPrice - amountPaid;
    let downPaymentDueDate: Date | null = null;

    if (amountPaid >= planPrice) {
      paymentStatus = 'paid';
      membershipStatus = 'active';
      balance = 0;
    } else if (amountPaid > 0) {
      paymentStatus = 'partial';
      membershipStatus = 'active';
      downPaymentDueDate = data.down_payment_due_date
        ? new Date(data.down_payment_due_date)
        : defaultDueDate();
      if (Number.isNaN(downPaymentDueDate.getTime())) {
        downPaymentDueDate = defaultDueDate();
      }
    } else {
      paymentStatus = 'pending';
      membershipStatus = 'pending';
    }

    const receivedById = userId ? await this.resolveStaffId(userId) : null;
    const customerUserId = customer.user_id;

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
          down_payment_due_date: downPaymentDueDate,
          notes: data.notes ?? null,
        },
        include: customerInclude,
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
            received_by: receivedById,
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

    // Notifications
    if (membershipStatus === 'active' && paymentStatus === 'partial') {
      const adminIds = await notificationDispatch.getAdminUserIds();
      await notificationDispatch.dispatchMembershipDownpayment({
        customerUserId,
        planName: plan.name,
        planPrice,
        amountPaid,
        balance,
        dueDate: downPaymentDueDate,
        customerPhone: customer.user.phone ?? undefined,
        adminUserIds: adminIds,
      });
    } else if (membershipStatus === 'active') {
      const adminIds = await notificationDispatch.getAdminUserIds();
      await notificationDispatch.dispatchMembershipFull({
        customerUserId,
        planName: plan.name,
        planPrice,
        customerPhone: customer.user.phone ?? undefined,
        adminUserIds: adminIds,
      });
    }

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
      include: customerInclude,
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
        include: customerInclude,
      });

      if (paid > 0) {
        await tx.membership_payments.create({
          data: {
            membership_id: id,
            amount: paid,
            payment_method: (payment_method as any) ?? 'cash',
            payment_type: (payment_type as any) ?? 'FULL',
            installment_no: null,
            received_by: null,
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
    await this.processOverdueMemberships(false);

    const membership = await prisma.memberships.findUnique({
      where: { code },
      include: customerInclude,
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
      include: {
        plan: true,
        customer: {
          include: {
            user: {
              select: {
                id: true,
                phone: true,
              },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    const newAmountPaid = Number(membership.amount_paid) + data.amount;
    let newBalance = Number(membership.price ?? 0) - newAmountPaid;

    let newPaymentStatus = membership.payment_status;
    let newMembershipStatus = membership.status;

    if (newAmountPaid >= Number(membership.price ?? 0)) {
      newPaymentStatus = 'paid';
      newMembershipStatus = 'active';
      newBalance = 0;
    } else if (newAmountPaid > 0) {
      newPaymentStatus = 'partial';
    }

    const receivedById = userId ? await this.resolveStaffId(userId) : null;

    const result = await prisma.$transaction(async (tx) => {
      const payment = await tx.membership_payments.create({
        data: {
          membership_id: membershipId,
          amount: data.amount,
          payment_method: data.payment_method,
          payment_type: data.payment_type as any,
          installment_no: data.installment_no ?? null,
          received_by: receivedById,
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
          down_payment_due_date: newPaymentStatus === 'paid' ? null : membership.down_payment_due_date,
          pay_in_store_requested: newPaymentStatus === 'paid' ? false : membership.pay_in_store_requested,
        },
      });

      if (newMembershipStatus === 'active' && membership.status !== 'active') {
        await tx.membership_activity_logs.create({
          data: {
            membership_id: membershipId,
            action: 'activated_via_payment',
            details: JSON.stringify({ fully_paid: true }),
            performed_by: receivedById ?? null,
          },
        });
      }

      return { payment, membership: updatedMembership };
    });

    // Notifications
    if (newPaymentStatus === 'paid') {
      const adminUserIds = await notificationDispatch.getAdminUserIds();
      await notificationDispatch.dispatchMembershipBalanceSettled({
        customerUserId: membership.customer.user.id,
        customerName: `${membership.customer.first_name} ${membership.customer.last_name}`,
        planName: membership.plan?.name ?? 'Membership',
        collectedAmount: data.amount,
        customerPhone: membership.customer.user.phone ?? undefined,
        adminUserIds,
      });
    }

    return result;
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

  /**
   * Customer opts to settle their remaining balance at the clinic. This raises a
   * flag surfaced to admins/staff so they can process the balance via POS.
   */
  async requestPayInStore(membershipId: number, role: string, userId: number) {
    await this.processOverdueMemberships(false);

    const membership = await prisma.memberships.findUnique({
      where: { id: membershipId },
      include: {
        plan: true,
        customer: {
          include: {
            user: {
              select: { id: true, phone: true },
            },
          },
        },
      },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    if (role === 'customer') {
      const customer = await prisma.customers.findUnique({ where: { user_id: userId } });
      if (!customer || membership.customer_id !== customer.id) {
        throw new AppError('You can only request this on your own membership', 403);
      }
    }

    if (Number(membership.balance) <= 0 || membership.payment_status === 'paid') {
      throw new AppError('This membership has no remaining balance', 400);
    }

    if (membership.status === 'failed' || membership.status === 'cancelled') {
      throw new AppError('This membership is no longer collectible', 400);
    }

    const updated = await prisma.memberships.update({
      where: { id: membershipId },
      data: { pay_in_store_requested: true },
      include: customerInclude,
    });

    const adminIds = await notificationDispatch.getAdminUserIds();
    await notificationDispatch.dispatchPayInStoreRequest({
      customerUserId: membership.customer.user.id,
      customerName: `${membership.customer.first_name} ${membership.customer.last_name}`,
      planName: membership.plan?.name ?? 'Membership',
      balance: Number(membership.balance),
      adminUserIds: adminIds,
    });

    return updated;
  }

  /**
   * Balance-due enforcement. Runs in three places so the rule holds even when
   * the Node process is down: (1) MySQL event (db/overdue.sql), (2) Node hourly
   * scheduler in server.ts, (3) lazily on membership reads.
   *
   * - Due date == today  -> send reminder (only from the scheduler, deduplicated)
   * - Due date passed    -> mark membership failed + notify
   */
  async processOverdueMemberships(includeReminders = true) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let reminded = 0;
    let failed = 0;

    if (includeReminders) {
      const dueToday = await prisma.memberships.findMany({
        where: {
          status: 'active',
          payment_status: 'partial',
          down_payment_due_date: today,
        },
        include: overdueInclude,
      });

      for (const m of dueToday) {
        const already = await prisma.membership_activity_logs.count({
          where: {
            membership_id: m.id,
            action: 'balance_reminder_sent',
            created_at: { gte: today },
          },
        });
        if (already > 0) continue;

        await notificationDispatch.dispatchMembershipBalanceReminder({
          customerUserId: m.customer.user.id,
          planName: m.plan?.name ?? 'Membership',
          balance: Number(m.balance),
          dueDate: m.down_payment_due_date,
          customerPhone: m.customer.user.phone ?? undefined,
        });

        await prisma.membership_activity_logs.create({
          data: {
            membership_id: m.id,
            action: 'balance_reminder_sent',
            details: JSON.stringify({ due_date: m.down_payment_due_date, balance: Number(m.balance) }),
          },
        });
        reminded += 1;
      }
    }

    const overdue = await prisma.memberships.findMany({
      where: {
        status: 'active',
        payment_status: 'partial',
        down_payment_due_date: { lt: today },
      },
      include: overdueInclude,
    });

    for (const m of overdue) {
      const adminIds = await notificationDispatch.getAdminUserIds();
      await notificationDispatch.dispatchMembershipFailed({
        customerUserId: m.customer.user.id,
        customerName: `${m.customer.first_name} ${m.customer.last_name}`,
        planName: m.plan?.name ?? 'Membership',
        balance: Number(m.balance),
        adminUserIds: adminIds,
      });

      await prisma.memberships.update({
        where: { id: m.id },
        data: { status: 'failed' },
      });

      await prisma.membership_activity_logs.create({
        data: {
          membership_id: m.id,
          action: 'status_changed_to_failed',
          details: JSON.stringify({
            reason: 'Downpayment balance unpaid past due date',
            due_date: m.down_payment_due_date,
            balance: Number(m.balance),
          }),
        },
      });
      failed += 1;
    }

    return { reminded, failed };
  }
}

function defaultDueDate(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const membershipService = new MembershipService();