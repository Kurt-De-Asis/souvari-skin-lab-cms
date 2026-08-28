import prisma from '../config/database';
import {
  resolveUnitPrice,
  applyMembershipDiscount,
  roundPeso,
  PriceMatrixRow,
  PriceAudience,
  ResolvedPrice,
} from './pricing-engine.core';

interface PricingInput {
  serviceId: number;
  membershipCode?: string;
  referralCreditAmount?: number;
  useMonthlyPerk?: boolean;
  staffTier?: string;
  gender?: string;
  variantKey?: string;
  quantity?: number;
}

interface PricingResult {
  basePrice: number;
  applicablePrice: number;
  priceType: 'regular' | 'vip' | 'non_member';
  vipSavings: number;
  membershipDiscount: number;
  bookingFee: number;
  monthlyPerkDiscount: number;
  referralCredit: number;
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
      include: {
        prices: { where: { is_available: true } },
        variants: { where: { is_active: true } },
      },
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

    // Build variant key → id map
    const variantKeyToId = new Map(service.variants.map((v) => [v.label.toLowerCase().replace(/\s+/g, '_'), v.id]));
    const variantKeyById = new Map(service.variants.map((v) => [v.variant_key, v.id]));

    // Also try mapping by variant_key directly
    for (const v of service.variants) {
      variantKeyToId.set(v.variant_key, v.id);
    }

    // Resolve active membership (by code or customerId)
    let activeMembership: {
      id: number;
      customer_id: number;
      code: string;
      status: string;
      plan: {
        tier: string;
        discount_pct: number | null;
        family: { eligible_categories: any } | null;
      };
      referral_credits: number;
    } | null = null;

    if (input.membershipCode) {
      const membership = await prisma.memberships.findUnique({
        where: { code: input.membershipCode },
        include: {
          plan: {
            select: {
              tier: true,
              discount_pct: true,
              family: { select: { eligible_categories: true } },
            },
          },
        },
      });

      if (membership && membership.status === 'active') {
        activeMembership = {
          id: membership.id,
          customer_id: membership.customer_id,
          code: membership.code,
          status: membership.status,
          plan: {
            tier: membership.plan.tier,
            discount_pct: membership.plan.discount_pct != null ? Number(membership.plan.discount_pct) : null,
            family: membership.plan.family,
          },
          referral_credits: Number(membership.referral_credits),
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
              family: { select: { eligible_categories: true } },
            },
          },
        },
        orderBy: { created_at: 'desc' },
      });

      if (membership) {
        activeMembership = {
          id: membership.id,
          customer_id: membership.customer_id,
          code: membership.code,
          status: membership.status,
          plan: {
            tier: membership.plan.tier,
            discount_pct: membership.plan.discount_pct != null ? Number(membership.plan.discount_pct) : null,
            family: membership.plan.family,
          },
          referral_credits: Number(membership.referral_credits),
        };
      }
    }

    // Determine audience from membership
    const audience: PriceAudience = activeMembership ? 'vip' : 'non_member';

    // Attempt new multi-dimensional pricing
    const matrix: PriceMatrixRow[] = service.prices.map((p) => ({
      id: p.id,
      service_id: p.service_id,
      service_variant_id: p.service_variant_id,
      audience: p.audience as PriceAudience,
      staff_tier: p.staff_tier as any,
      gender_scope: p.gender_scope as any,
      amount: Number(p.amount),
      is_available: p.is_available,
      needs_verification: p.needs_verification,
      source_ref: p.source_ref,
    }));

    let resolved: ResolvedPrice | null = null;

    if (matrix.length > 0) {
      resolved = resolveUnitPrice(
        matrix,
        {
          variant_key: input.variantKey,
          audience,
          staff_tier: input.staffTier as any,
          gender: input.gender as any,
          quantity: input.quantity,
        },
        variantKeyToId
      );
    }

    if (resolved) {
      applicablePrice = resolved.amount;
      priceType = resolved.audience as any;
      vipSavings = audience === 'vip' ? basePrice - resolved.amount : 0;
      needsVerification = resolved.needs_verification;

      if (resolved.warnings.length > 0) {
        benefits.push(...resolved.warnings);
      }

      if (activeMembership) {
        bookingFee = 0;
        benefits.push('VIP pricing applied');
        benefits.push('Free booking fee');

        // Apply family-based discount
        if (activeMembership.plan.family?.eligible_categories) {
          const eligible = activeMembership.plan.family.eligible_categories as string[];
          const discount = applyMembershipDiscount(
            applicablePrice,
            eligible,
            service.category,
            activeMembership.plan.discount_pct
          );
          if (discount.applied) {
            membershipDiscount = discount.discount;
            applicablePrice = discount.discounted;
            benefits.push(`${activeMembership.plan.discount_pct}% membership discount on eligible category`);
          }
        } else if (activeMembership.plan.discount_pct) {
          const discountPct = activeMembership.plan.discount_pct;
          const discount = roundPeso(applicablePrice * (discountPct / 100));
          membershipDiscount = discount;
          applicablePrice = roundPeso(applicablePrice - discount);
          benefits.push(`${discountPct}% membership discount`);
        }
      } else {
        bookingFee = 300;
      }
    } else {
      // Fallback to legacy flat-column pricing
      if (activeMembership && service.vip_price !== null) {
        const vipPrice = Number(service.vip_price);
        vipSavings = basePrice - vipPrice;
        applicablePrice = vipPrice;
        priceType = 'vip';
        bookingFee = 0;
        benefits.push('VIP pricing applied (legacy)');
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
        benefits.push(`${Math.round(discountPct * 100)}% membership discount (legacy)`);
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

    // Referral credit
    let referralCredit = 0;
    if (input.referralCreditAmount && input.referralCreditAmount > 0) {
      if (customerId) {
        const totalBalance = await prisma.referral_rewards.aggregate({
          where: { customer_id: customerId },
          _sum: { balance: true },
        });

        const availableCredit = Number(totalBalance._sum.balance ?? 0);
        referralCredit = Math.min(input.referralCreditAmount, availableCredit);
        benefits.push(`Referral credit applied: ₱${referralCredit}`);
      } else {
        referralCredit = input.referralCreditAmount;
        benefits.push(`Referral credit applied: ₱${referralCredit}`);
      }
    }

    // Calculate final total
    const subtotal = applicablePrice - monthlyPerkDiscount - referralCredit;
    const finalTotal = Math.max(0, roundPeso(subtotal));

    // Build price breakdown
    const quantity = input.quantity || 1;
    const priceBreakdown = [
      {
        service_id: service.id,
        variant_id: resolved?.variant_id ?? undefined,
        audience: priceType,
        staff_tier: input.staffTier ?? undefined,
        unit_amount: roundPeso(applicablePrice / quantity),
        quantity,
        line_total: roundPeso(applicablePrice),
        warnings: resolved?.warnings ?? [],
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
      referralCredit,
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
