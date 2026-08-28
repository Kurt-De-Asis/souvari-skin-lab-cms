import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../utils/pagination';
import {
  CreateGiftInput,
  GiftQuery,
} from './membership-gifts.validation';

export class MembershipGiftService {
  async createGift(membershipId: number, data: CreateGiftInput) {
    const membership = await prisma.memberships.findUnique({
      where: { id: membershipId },
      include: { plan: true },
    });

    if (!membership) {
      throw new AppError('Membership not found', 404);
    }

    if (membership.status !== 'active') {
      throw new AppError('Membership must be active to nominate a gift', 400);
    }

    if (membership.plan.duration_months !== 12) {
      throw new AppError('Gift nomination is only available for 12-month membership plans', 400);
    }

    const existingGift = await prisma.membership_gifts.findFirst({
      where: { membership_id: membershipId },
    });

    if (existingGift) {
      throw new AppError('This membership already has a gift nomination', 409);
    }

    const gift = await prisma.membership_gifts.create({
      data: {
        membership_id: membershipId,
        nominee_name: data.nominee_name,
        nominee_email: data.nominee_email ?? null,
        nominee_phone: data.nominee_phone ?? null,
        notes: data.notes ?? null,
        status: 'pending_approval',
      },
      include: {
        membership: {
          include: {
            plan: true,
          },
        },
      },
    });

    return gift;
  }

  async getGiftsForMembership(membershipId: number) {
    const gifts = await prisma.membership_gifts.findMany({
      where: { membership_id: membershipId },
      include: {
        membership: {
          include: {
            plan: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return gifts;
  }

  async list(query: GiftQuery): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);
    const { status, membership_id } = query;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (membership_id) {
      where.membership_id = membership_id;
    }

    const [gifts, total] = await Promise.all([
      prisma.membership_gifts.findMany({
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
      prisma.membership_gifts.count({ where }),
    ]);

    return createPaginatedResult(gifts, total, { page, limit, skip });
  }

  async getById(id: number) {
    const gift = await prisma.membership_gifts.findUnique({
      where: { id },
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
    });

    if (!gift) {
      throw new AppError('Gift not found', 404);
    }

    return gift;
  }

  async approveGift(id: number, status: 'approved' | 'rejected', approvedBy: number, notes?: string | null) {
    const gift = await prisma.membership_gifts.findUnique({
      where: { id },
    });

    if (!gift) {
      throw new AppError('Gift not found', 404);
    }

    if (gift.status !== 'pending_approval') {
      throw new AppError('Gift is not pending approval', 400);
    }

    const now = new Date();
    const dbStatus = status === 'approved' ? 'approved' : 'available';

    const updated = await prisma.membership_gifts.update({
      where: { id },
      data: {
        status: dbStatus as any,
        approved_by: status === 'approved' ? approvedBy : null,
        approved_at: status === 'approved' ? now : null,
        notes: notes ?? gift.notes,
      },
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
    });

    return updated;
  }

  async redeemGift(id: number) {
    const gift = await prisma.membership_gifts.findUnique({
      where: { id },
      include: {
        membership: {
          include: {
            plan: true,
          },
        },
      },
    });

    if (!gift) {
      throw new AppError('Gift not found', 404);
    }

    if (gift.status !== 'approved') {
      throw new AppError('Gift must be approved before it can be redeemed', 400);
    }

    const updated = await prisma.membership_gifts.update({
      where: { id },
      data: {
        status: 'redeemed',
        redeemed_at: new Date(),
      },
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
    });

    return updated;
  }
}

export const membershipGiftService = new MembershipGiftService();
