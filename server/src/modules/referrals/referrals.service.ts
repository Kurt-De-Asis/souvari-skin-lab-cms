import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../utils/pagination';
import { CreateReferralInput, ReferralQuery } from './referrals.validation';

export class ReferralService {
  async createReferral(membershipId: number, data: CreateReferralInput) {
    const membership = await prisma.memberships.findFirst({
      where: {
        id: membershipId,
        status: 'active',
      },
    });

    if (!membership) {
      throw new AppError('No active membership found. Only active members can make referrals.', 400);
    }

    const existingReferral = await prisma.referrals.findFirst({
      where: {
        referrer_membership_id: membershipId,
        referred_email: data.referred_email,
      },
    });

    if (existingReferral) {
      throw new AppError('You have already referred this email address', 409);
    }

    const referral = await prisma.referrals.create({
      data: {
        referrer_membership_id: membershipId,
        referred_name: data.referred_name,
        referred_email: data.referred_email,
        status: 'pending',
        credit_amount: 0,
      },
      include: {
        referrer: {
          include: {
            customer: {
              include: {
                user: {
                  select: { id: true, email: true, phone: true },
                },
              },
            },
            plan: true,
          },
        },
      },
    });

    return referral;
  }

  async getReferralsForMembership(membershipId: number) {
    const referrals = await prisma.referrals.findMany({
      where: { referrer_membership_id: membershipId },
      include: {
        referred: {
          include: {
            customer: {
              include: {
                user: {
                  select: { id: true, email: true, phone: true },
                },
              },
            },
            plan: true,
          },
        },
        rewards: true,
      },
      orderBy: { created_at: 'desc' },
    });

    return referrals;
  }

  async list(query: ReferralQuery): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);
    const { status, customer_id } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (customer_id) {
      where.referrer = { customer_id };
    }

    const [referrals, total] = await Promise.all([
      prisma.referrals.findMany({
        where,
        include: {
          referrer: {
            include: {
              customer: {
                include: {
                  user: {
                    select: { id: true, email: true, phone: true, role: true },
                  },
                },
              },
              plan: true,
            },
          },
          referred: {
            include: {
              customer: {
                include: {
                  user: {
                    select: { id: true, email: true, phone: true, role: true },
                  },
                },
              },
              plan: true,
            },
          },
          rewards: true,
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.referrals.count({ where }),
    ]);

    return createPaginatedResult(referrals, total, { page, limit, skip });
  }

  async getById(id: number) {
    const referral = await prisma.referrals.findUnique({
      where: { id },
      include: {
        referrer: {
          include: {
            customer: {
              include: {
                user: {
                  select: { id: true, email: true, phone: true, role: true },
                },
              },
            },
            plan: true,
          },
        },
        referred: {
          include: {
            customer: {
              include: {
                user: {
                  select: { id: true, email: true, phone: true, role: true },
                },
              },
            },
            plan: true,
          },
        },
        rewards: true,
      },
    });

    if (!referral) {
      throw new AppError('Referral not found', 404);
    }

    return referral;
  }

  async approveReferral(id: number, status: 'completed' | 'rejected', creditAmount?: number, approvedBy?: number) {
    const referral = await prisma.referrals.findUnique({
      where: { id },
      include: {
        referrer: {
          include: {
            plan: true,
            customer: true,
          },
        },
      },
    });

    if (!referral) {
      throw new AppError('Referral not found', 404);
    }

    if (referral.status !== 'pending') {
      throw new AppError('This referral has already been processed', 400);
    }

    if (status === 'rejected') {
      const updated = await prisma.referrals.update({
        where: { id },
        data: { status: 'rejected' },
        include: { rewards: true },
      });
      return updated;
    }

    const existingReward = await prisma.referral_rewards.findFirst({
      where: { referral_id: id },
    });

    if (existingReward) {
      throw new AppError('A reward has already been issued for this referral', 409);
    }

    const defaultCredit = referral.referrer.plan.duration_months === 12 ? 500 : 200;
    const finalAmount = creditAmount ?? defaultCredit;

    const result = await prisma.$transaction(async (tx) => {
      const updatedReferral = await tx.referrals.update({
        where: { id },
        data: {
          status: 'completed',
          credit_amount: finalAmount,
        },
        include: {
          referrer: {
            include: {
              customer: true,
              plan: true,
            },
          },
          rewards: true,
        },
      });

      const customer = referral.referrer.customer;

      const reward = await tx.referral_rewards.create({
        data: {
          referral_id: id,
          customer_id: customer.id,
          credit_amount: finalAmount,
          credit_type: 'referral',
          balance: finalAmount,
          notes: `Referral reward for referring ${referral.referred_name}`,
        },
      });

      await tx.memberships.update({
        where: { id: referral.referrer_membership_id },
        data: {
          referral_credits: {
            increment: finalAmount,
          },
        },
      });

      updatedReferral.rewards = [reward];
      return updatedReferral;
    });

    return result;
  }

  async getReferralBalance(customerId: number) {
    const rewards = await prisma.referral_rewards.findMany({
      where: { customer_id: customerId },
    });

    const totalBalance = rewards.reduce((sum, r) => sum + Number(r.balance), 0);

    return {
      customer_id: customerId,
      total_balance: totalBalance,
      rewards,
    };
  }
}

export const referralService = new ReferralService();
