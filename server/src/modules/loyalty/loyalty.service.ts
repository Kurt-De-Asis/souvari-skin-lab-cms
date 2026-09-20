import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../utils/pagination';
import {
  LoyaltyQuery,
  CreateMilestoneInput,
  UpdateMilestoneInput,
} from './loyalty.validation';

export class LoyaltyService {
  async getProgress(membershipId: number) {
    const membership = await prisma.memberships.findUnique({
      where: { id: membershipId },
      include: { plan: true },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    const progress = await prisma.loyalty_progress.findUnique({
      where: { membership_id: membershipId },
    });

    if (!progress) {
      throw new AppError('Loyalty progress not found for this membership', 404);
    }

    const planType = membership.plan.tier as any;

    const milestones = await prisma.loyalty_milestones.findMany({
      where: {
        plan_type: planType,
        is_active: true,
      },
      orderBy: { spend_threshold: 'asc' },
    });

    const recentLogs = await prisma.membership_activity_logs.findMany({
      where: { membership_id: membershipId },
      orderBy: { created_at: 'desc' },
      take: 8,
    });

    const recentActivity = recentLogs.map((log) => {
      let parsed: any = {};
      try {
        parsed = JSON.parse(log.details ?? '{}');
      } catch {
        parsed = {};
      }

      let type = 'activity';
      if (log.action === 'perk_used' || log.action === 'perk_reset') type = 'perk';
      else if (log.action === 'loyalty_spend_adjusted') type = 'spend';
      else if (log.action.includes('referral')) type = 'referral';
      else if (log.action === 'membership_availed' || log.action === 'availed') type = 'membership';

      let amount: number | null = null;
      if (log.action === 'loyalty_spend_adjusted' && parsed.amount != null) {
        amount = Number(parsed.amount);
      } else if (parsed.discount_amount != null) {
        amount = Number(parsed.discount_amount);
      } else if (parsed.amount != null) {
        amount = Number(parsed.amount);
      } else if (parsed.credit_amount != null) {
        amount = Number(parsed.credit_amount);
      } else if (parsed.months_added != null) {
        amount = Number(parsed.months_added);
      }

      const descriptionMap: Record<string, string> = {
        membership_availed: 'Your membership was activated',
        availed: 'Your membership was activated',
        extended: 'Membership extended',
        perk_used: 'Monthly perk redeemed',
        perk_reset: 'Monthly perk reset',
        loyalty_spend_adjusted: 'Qualifying spend updated',
      };
      const description = descriptionMap[log.action] ?? (log.action ? log.action.replace(/_/g, ' ') : 'Activity');

      return {
        id: log.id,
        type,
        description,
        amount,
        created_at: log.created_at,
      };
    });

    return {
      membership: {
        id: membership.id,
        code: membership.code,
        status: membership.status,
        plan: membership.plan,
      },
      progress: {
        qualifying_spend: progress.qualifying_spend,
        total_spend: progress.total_spend,
        highest_reward_pct: progress.highest_reward_pct,
        updated_at: progress.updated_at,
      },
      milestones,
      recent_activity: recentActivity,
    };
  }

  async listMilestones(query: LoyaltyQuery): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);
    const { plan_type } = query;

    const where: any = {};

    if (plan_type) {
      where.plan_type = plan_type;
    }

    const [milestones, total] = await Promise.all([
      prisma.loyalty_milestones.findMany({
        where,
        orderBy: { spend_threshold: 'asc' },
        skip,
        take: limit,
      }),
      prisma.loyalty_milestones.count({ where }),
    ]);

    return createPaginatedResult(milestones, total, { page, limit, skip });
  }

  async createMilestone(data: CreateMilestoneInput) {
    const milestone = await prisma.loyalty_milestones.create({
      data: {
        plan_type: data.plan_type,
        spend_threshold: data.spend_threshold,
        reward_pct: data.reward_pct,
        label: data.label ?? null,
        plan_id: data.plan_id ?? null,
        is_active: data.is_active ?? true,
      },
    });

    return milestone;
  }

  async updateMilestone(id: number, data: UpdateMilestoneInput) {
    const existing = await prisma.loyalty_milestones.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Milestone not found', 404);
    }

    const milestone = await prisma.loyalty_milestones.update({
      where: { id },
      data: {
        spend_threshold: data.spend_threshold,
        reward_pct: data.reward_pct,
        label: data.label ?? existing.label,
        is_active: data.is_active ?? existing.is_active,
      },
    });

    return milestone;
  }

  async deleteMilestone(id: number) {
    const existing = await prisma.loyalty_milestones.findUnique({ where: { id } });

    if (!existing) {
      throw new AppError('Milestone not found', 404);
    }

    await prisma.loyalty_milestones.delete({ where: { id } });

    return { message: 'Milestone deleted successfully' };
  }

  async adjustSpend(membershipId: number, amount: number, reason: string, performedBy?: number) {
    const membership = await prisma.memberships.findUnique({
      where: { id: membershipId },
      include: { plan: true },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    if (membership.status !== 'active') {
      throw new AppError('Can only adjust spend for active memberships', 400);
    }

    const progress = await prisma.loyalty_progress.findUnique({
      where: { membership_id: membershipId },
    });

    if (!progress) {
      throw new AppError('Loyalty progress not found', 404);
    }

    const newQualifyingSpend = Number(progress.qualifying_spend) + amount;

    if (newQualifyingSpend < 0) {
      throw new AppError('Adjustment would result in negative qualifying spend', 400);
    }

    const updatedProgress = await prisma.$transaction(async (tx) => {
      const updated = await tx.loyalty_progress.update({
        where: { membership_id: membershipId },
        data: { qualifying_spend: newQualifyingSpend },
      });

      await tx.membership_activity_logs.create({
        data: {
          membership_id: membershipId,
          action: 'loyalty_spend_adjusted',
          details: JSON.stringify({
            amount,
            reason,
            old_qualifying_spend: progress.qualifying_spend,
            new_qualifying_spend: updated.qualifying_spend,
          }),
          performed_by: performedBy ?? null,
        },
      });

      return updated;
    });

    const highestReward = await this.checkMilestoneRewards(membershipId);

    await prisma.loyalty_progress.update({
      where: { membership_id: membershipId },
      data: { highest_reward_pct: highestReward },
    });

    return {
      ...updatedProgress,
      highest_reward_pct: highestReward,
    };
  }

  async recalculateProgress(membershipId: number) {
    const membership = await prisma.memberships.findUnique({
      where: { id: membershipId },
      include: { plan: true },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    const progress = await prisma.loyalty_progress.findUnique({
      where: { membership_id: membershipId },
    });

    if (!progress) {
      throw new AppError('Loyalty progress not found', 404);
    }

    const qualifyingResult = await prisma.transactions.aggregate({
      where: {
        customer_id: membership.customer_id,
        payment_status: 'paid',
        deleted_at: null,
        NOT: {
          OR: [
            { type: 'refund' },
          ],
        },
      },
      _sum: { total_amount: true },
    });

    const totalResult = await prisma.transactions.aggregate({
      where: {
        customer_id: membership.customer_id,
        deleted_at: null,
      },
      _sum: { total_amount: true },
    });

    const qualifyingSpend = qualifyingResult._sum.total_amount ?? 0;
    const totalSpend = totalResult._sum.total_amount ?? 0;

    const updatedProgress = await prisma.loyalty_progress.update({
      where: { membership_id: membershipId },
      data: {
        qualifying_spend: qualifyingSpend,
        total_spend: totalSpend,
      },
    });

    const highestReward = await this.checkMilestoneRewards(membershipId);

    await prisma.loyalty_progress.update({
      where: { membership_id: membershipId },
      data: { highest_reward_pct: highestReward },
    });

    return {
      ...updatedProgress,
      highest_reward_pct: highestReward,
    };
  }

  async checkMilestoneRewards(membershipId: number): Promise<number> {
    const membership = await prisma.memberships.findUnique({
      where: { id: membershipId },
      include: { plan: true },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    const progress = await prisma.loyalty_progress.findUnique({
      where: { membership_id: membershipId },
    });

    if (!progress) {
      throw new AppError('Loyalty progress not found', 404);
    }

    const planType = membership.plan.tier as any;

    const milestones = await prisma.loyalty_milestones.findMany({
      where: {
        plan_type: planType,
        is_active: true,
      },
      orderBy: { spend_threshold: 'desc' },
    });

    let highestReward = 0;

    for (const milestone of milestones) {
      if (Number(progress.qualifying_spend) >= Number(milestone.spend_threshold)) {
        highestReward = Number(milestone.reward_pct);
        break;
      }
    }

    return highestReward;
  }
}

export const loyaltyService = new LoyaltyService();
