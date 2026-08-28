import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../utils/pagination';
import { MonthlyPerksQuery } from './monthly-perks.validation';

function getCurrentYearMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export class MonthlyPerksService {
  async getMyPerk(membershipId: number) {
    const membership = await prisma.memberships.findUnique({
      where: { id: membershipId },
      include: { plan: true },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    const perk = await this.ensureMonthlyPerk(membershipId);
    return perk;
  }

  async list(query: MonthlyPerksQuery): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);
    const { membership_id, year_month, status } = query;

    const where: any = {};

    if (membership_id) {
      where.membership_id = membership_id;
    }

    if (year_month) {
      where.year_month = year_month;
    }

    if (status) {
      where.status = status;
    }

    const [perks, total] = await Promise.all([
      prisma.monthly_perks.findMany({
        where,
        include: {
          membership: {
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
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.monthly_perks.count({ where }),
    ]);

    return createPaginatedResult(perks, total, { page, limit, skip });
  }

  async usePerk(membershipId: number, discountAmount: number, transactionId?: number) {
    const perk = await this.ensureMonthlyPerk(membershipId);

    if (perk.status !== 'available') {
      throw new AppError('Perk is not available', 400);
    }

    const maxValue = perk.max_value.toNumber();
    if (discountAmount > maxValue) {
      throw new AppError(`Discount cannot exceed the maximum value of ${maxValue}`, 400);
    }

    const now = new Date();
    const currentYearMonth = getCurrentYearMonth();
    const [year, month] = currentYearMonth.split('-').map(Number);
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0, 23, 59, 59);

    if (now < monthStart || now > monthEnd) {
      throw new AppError('Perk cannot be used outside of the current month', 400);
    }

    const updated = await prisma.monthly_perks.update({
      where: { id: perk.id },
      data: {
        status: 'used',
        used_at: now,
        transaction_id: transactionId ?? null,
      },
      include: {
        membership: {
          include: {
            plan: true,
          },
        },
      },
    });

    return updated;
  }

  async resetPerk(membershipId: number, yearMonth: string, performedBy: number) {
    const membership = await prisma.memberships.findUnique({
      where: { id: membershipId },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    const perk = await prisma.monthly_perks.findUnique({
      where: {
        membership_id_year_month: {
          membership_id: membershipId,
          year_month: yearMonth,
        },
      },
    });

    if (!perk) {
      throw new AppError('Monthly perk not found for the specified period', 404);
    }

    if (perk.status === 'available') {
      throw new AppError('Perk is already available', 400);
    }

    const updated = await prisma.monthly_perks.update({
      where: { id: perk.id },
      data: {
        status: 'available',
        used_at: null,
        transaction_id: null,
      },
    });

    await prisma.membership_activity_logs.create({
      data: {
        membership_id: membershipId,
        action: 'perk_reset',
        details: JSON.stringify({ year_month: yearMonth, old_status: perk.status }),
        performed_by: performedBy,
      },
    });

    return updated;
  }

  async ensureMonthlyPerk(membershipId: number) {
    const membership = await prisma.memberships.findUnique({
      where: { id: membershipId },
      include: { plan: true },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    if (membership.status !== 'active') {
      throw new AppError('Membership is not active', 400);
    }

    const currentYearMonth = getCurrentYearMonth();

    const existing = await prisma.monthly_perks.findUnique({
      where: {
        membership_id_year_month: {
          membership_id: membershipId,
          year_month: currentYearMonth,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const perk = await prisma.monthly_perks.create({
      data: {
        membership_id: membershipId,
        year_month: currentYearMonth,
        status: 'available',
        max_value: membership.plan.promo_price,
        min_spend: 800,
      },
    });

    return perk;
  }
}

export const monthlyPerksService = new MonthlyPerksService();
