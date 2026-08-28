import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../utils/pagination';
import {
  CreateMembershipPlanInput,
  UpdateMembershipPlanInput,
  MembershipPlanQuery,
} from './membership-plans.validation';

export class MembershipPlanService {
  async list(query: MembershipPlanQuery): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);
    const { search, tier, is_active } = query;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    if (tier) {
      where.tier = tier;
    }

    if (is_active !== undefined) {
      where.is_active = is_active;
    }

    const [plans, total] = await Promise.all([
      prisma.membership_plans.findMany({
        where,
        include: {
          _count: { select: { benefits: true } },
        },
        orderBy: [{ tier: 'asc' }, { created_at: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.membership_plans.count({ where }),
    ]);

    return createPaginatedResult(plans, total, { page, limit, skip });
  }

  async listPublic(): Promise<any[]> {
    const plans = await prisma.membership_plans.findMany({
      where: { is_active: true },
      include: {
        benefits: {
          where: { is_active: true },
        },
      },
      orderBy: [{ tier: 'asc' }, { regular_price: 'asc' }],
    });

    return plans;
  }

  async getById(id: number): Promise<any> {
    const plan = await prisma.membership_plans.findUnique({
      where: { id },
      include: {
        benefits: true,
        _count: { select: { memberships: true } },
      },
    });

    if (!plan) {
      throw new AppError('Membership plan not found', 404);
    }

    return plan;
  }

  async create(data: CreateMembershipPlanInput): Promise<any> {
    const plan = await prisma.membership_plans.create({
      data: {
        name: data.name,
        tier: data.tier,
        duration_months: data.duration_months,
        regular_price: data.regular_price,
        promo_price: data.promo_price,
        discount_pct: data.discount_pct ?? null,
        description: data.description ?? null,
        is_active: data.is_active ?? true,
      },
      include: {
        benefits: true,
      },
    });

    return plan;
  }

  async update(id: number, data: UpdateMembershipPlanInput): Promise<any> {
    const existing = await prisma.membership_plans.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Membership plan not found', 404);
    }

    const plan = await prisma.membership_plans.update({
      where: { id },
      data,
      include: {
        benefits: true,
      },
    });

    return plan;
  }

  async delete(id: number): Promise<void> {
    const existing = await prisma.membership_plans.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new AppError('Membership plan not found', 404);
    }

    await prisma.membership_plans.update({
      where: { id },
      data: { is_active: false },
    });
  }
}

export const membershipPlanService = new MembershipPlanService();
