import prisma from '../config/database';
import { roundPeso } from './pricing-engine.core';

export interface PricingInput {
  serviceId: number;
  membershipCode?: string;
  useMonthlyPerk?: boolean;
  quantity?: number;
}

function isActiveMembership(membership: { end_date: Date }): boolean {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(membership.end_date);
  end.setHours(23, 59, 59, 999);
  return now <= end;
}

export interface PricingResult {
  basePrice: number;
  applicablePrice: number;
  priceType: 'regular' | 'vip' | 'non_member';
  vipSavings: number;
  membershipDiscount: number;
  bookingFee: number;
  monthlyPerkDiscount: number;
  finalTotal: number;
  benefits: string[];
  perksApplied: string[];
  priceBreakdown: Array<{
    service_id: number;
    variant_id?: number;
    audience: string;
    staff_tier?: string;
    unit_amount: number;
    quantity: number;
    line_total: number;
    warnings: string[];
  }>;
  needsVerification: boolean;
}

class PricingService {
  async calculatePrice(input: PricingInput, customerId?: number): Promise<PricingResult> {
    const service = await prisma.services.findUnique({
      where: { id: input.serviceId },
    });

    if (!service) {
      throw new Error(`Service with ID ${input.serviceId} not found`);
    }

    const basePrice = Number(service.price);
    let applicablePrice = basePrice;
    let priceType: 'regular' | 'vip' | 'non_member' = 'regular';
    let vipSavings = 0;
    let membershipDiscount = 0;
    let bookingFee = 300;
    const benefits: string[] = [];
    const perksApplied: string[] = [];
    let needsVerification = false;

    // Resolve active membership (by code or customerId)
    let activeMembership: {
      id: number;
      customer_id: number;
      code: string;
      status: string;
      plan: {
        tier: string;
        discount_pct: number | null;
      };
    } | null = null;

    if (input.membershipCode) {
      const membership = await prisma.memberships.findUnique({
        where: { code: input.membershipCode },
        include: {
          plan: {
            select: {
              tier: true,
              discount_pct: true,
            },
          },
        },
      });

      if (membership && membership.status === 'active' && isActiveMembership(membership)) {
        activeMembership = {
          id: membership.id,
          customer_id: membership.customer_id,
          code: membership.code,
          status: membership.status,
          plan: {
            tier: membership.plan.tier,
            discount_pct: membership.plan.discount_pct != null ? Number(membership.plan.discount_pct) : null,
          },
        };
      }
    } else if (customerId) {
      const membership = await prisma.memberships.findFirst({
        where: { customer_id: customerId, status: 'active' },
        include: {
          plan: {
            select: {
              tier: true,
              discount_pct: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      if (membership && isActiveMembership(membership)) {
        activeMembership = {
          id: membership.id,
          customer_id: membership.customer_id,
          code: membership.code,
          status: membership.status,
          plan: {
            tier: membership.plan.tier,
            discount_pct: membership.plan.discount_pct != null ? Number(membership.plan.discount_pct) : null,
          },
        };
      }
    }

    // Segment pricing using flat-column pricing
    if (activeMembership && service.vip_price !== null) {
      const vipPrice = Number(service.vip_price);
      vipSavings = basePrice - vipPrice;
      applicablePrice = vipPrice;
      priceType = 'vip';
      bookingFee = 0;
      benefits.push('VIP pricing applied');
      benefits.push('Free booking fee');
    } else if (activeMembership) {
      const discountPct = activeMembership.plan.discount_pct
        ? activeMembership.plan.discount_pct / 100
        : 0.25;
      const discount = basePrice * discountPct;
      applicablePrice = basePrice - discount;
      membershipDiscount = discount;
      priceType = 'regular';
      bookingFee = 0;
      benefits.push(`${Math.round(discountPct * 100)}% membership discount`);
      benefits.push('Free booking fee');
    } else {
      if (service.non_member_price !== null) {
        applicablePrice = Number(service.non_member_price);
        priceType = 'non_member';
        if (applicablePrice > basePrice) {
          benefits.push('Non-member pricing applied');
        }
      }
      bookingFee = 300;
    }

    // Monthly perk
    let monthlyPerkDiscount = 0;
    if (input.useMonthlyPerk && activeMembership) {
      const now = new Date();
      const yearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const perk = await prisma.monthly_perks.findUnique({
        where: {
          membership_id_year_month: {
            membership_id: activeMembership.id,
            year_month: yearMonth,
          },
        },
      });

      if (perk && perk.status === 'available') {
        const minSpend = Number(perk.min_spend);
        const maxValue = Number(perk.max_value);

        if (applicablePrice >= minSpend) {
          monthlyPerkDiscount = Math.min(applicablePrice, maxValue);
          perksApplied.push(`Monthly perk: ₱${monthlyPerkDiscount} off (min spend ₱${minSpend})`);
        } else {
          perksApplied.push(`Monthly perk requires minimum spend of ₱${minSpend}`);
        }
      } else if (perk && perk.status === 'used') {
        perksApplied.push('Monthly perk already used this month');
      } else {
        perksApplied.push('No monthly perk available for this month');
      }
    }

    // Calculate final total
    const subtotal = applicablePrice - monthlyPerkDiscount;
    const finalTotal = Math.max(0, roundPeso(subtotal));

    // Build price breakdown
    const quantity = input.quantity || 1;
    const priceBreakdown = [
      {
        service_id: service.id,
        audience: priceType,
        unit_amount: roundPeso(applicablePrice / quantity),
        quantity,
        line_total: roundPeso(applicablePrice),
        warnings: [] as string[],
      },
    ];

    return {
      basePrice,
      applicablePrice,
      priceType,
      vipSavings,
      membershipDiscount,
      bookingFee,
      monthlyPerkDiscount,
      finalTotal,
      benefits,
      perksApplied,
      priceBreakdown,
      needsVerification,
    };
  }

  async getEffectivePrice(serviceId: number, customerId?: number): Promise<{ price: number; priceType: string }> {
    const result = await this.calculatePrice({ serviceId }, customerId);
    return { price: result.finalTotal, priceType: result.priceType };
  }
}

export default new PricingService();