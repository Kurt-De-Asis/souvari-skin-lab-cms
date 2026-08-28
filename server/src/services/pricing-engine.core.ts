export type PriceAudience = 'vip' | 'non_member' | 'regular';
export type StaffPriceTier = 'standard' | 'technician' | 'senior' | 'guru';
export type GenderScope = 'any' | 'male' | 'female';

export interface PriceMatrixRow {
  id: number;
  service_id: number;
  service_variant_id: number | null;
  audience: PriceAudience;
  staff_tier: StaffPriceTier;
  gender_scope: GenderScope;
  amount: number;
  is_available: boolean;
  needs_verification: boolean;
  source_ref: string | null;
}

export interface PriceSelector {
  variant_key?: string;
  audience: PriceAudience;
  staff_tier?: StaffPriceTier;
  gender?: GenderScope;
  quantity?: number;
}

export interface ResolvedPrice {
  price_rule_id: number;
  amount: number;
  audience: PriceAudience;
  staff_tier: StaffPriceTier;
  gender_scope: GenderScope;
  variant_id: number | null;
  is_available: boolean;
  needs_verification: boolean;
  source_ref: string | null;
  warnings: string[];
}

export interface PriceBreakdownItem {
  service_id: number;
  service_name: string;
  variant_label?: string;
  audience: PriceAudience;
  staff_tier?: StaffPriceTier;
  unit_amount: number;
  quantity: number;
  line_total: number;
  warnings: string[];
}

export interface PriceBreakdown {
  items: PriceBreakdownItem[];
  subtotal: number;
  membership_discount: number;
  monthly_perk_discount: number;
  referral_credit: number;
  booking_fee: number;
  final_total: number;
  benefits: string[];
  perks_applied: string[];
}

export interface InstallmentOption {
  months: number;
  down_payment_pct: number;
  payment_method: string;
}

export interface InstallmentResult {
  down_payment: number;
  monthly_payment: number;
  total: number;
  months: number;
}

function roundPeso(amount: number): number {
  return Math.round(amount * 100) / 100;
}

function genderMatches(row: PriceMatrixRow, selector: PriceSelector): boolean {
  if (!selector.gender) return true;
  if (row.gender_scope === 'any') return true;
  return row.gender_scope === selector.gender;
}

function fallbackStaffTier(tier: StaffPriceTier): StaffPriceTier {
  if (tier === 'guru') return 'senior';
  if (tier === 'senior') return 'technician';
  return 'standard';
}

function fallbackGender(gender: GenderScope): GenderScope | null {
  if (gender === 'female') return 'any';
  if (gender === 'male') return 'any';
  return null;
}

export function resolveUnitPrice(
  matrix: PriceMatrixRow[],
  selector: PriceSelector,
  variantIdMap: Map<string, number>
): ResolvedPrice | null {
  const variantId = selector.variant_key ? variantIdMap.get(selector.variant_key) ?? null : null;
  const quantity = selector.quantity || 1;
  const staffTier = selector.staff_tier || 'standard';
  const gender = selector.gender || 'any';

  const attempts: Array<{ desc: string; filter: (r: PriceMatrixRow) => boolean }> = [];

  // Primary: exact match
  attempts.push({
    desc: `exact: v=${variantId} a=${selector.audience} t=${staffTier} g=${gender}`,
    filter: (r) =>
      r.service_variant_id === variantId &&
      r.audience === selector.audience &&
      r.staff_tier === staffTier &&
      r.gender_scope === gender,
  });

  // Fallback 1: gender → any
  const genderFallback = fallbackGender(gender as GenderScope);
  if (genderFallback) {
    attempts.push({
      desc: `gender_fallback: v=${variantId} a=${selector.audience} t=${staffTier} g=${genderFallback}`,
      filter: (r) =>
        r.service_variant_id === variantId &&
        r.audience === selector.audience &&
        r.staff_tier === staffTier &&
        r.gender_scope === genderFallback,
    });
  }

  // Fallback 2: staff_tier → standard
  const staffFallback = fallbackStaffTier(staffTier as StaffPriceTier);
  if (staffFallback !== staffTier) {
    attempts.push({
      desc: `staff_fallback: v=${variantId} a=${selector.audience} t=${staffFallback} g=${gender}`,
      filter: (r) =>
        r.service_variant_id === variantId &&
        r.audience === selector.audience &&
        r.staff_tier === staffFallback &&
        r.gender_scope === gender,
    });
  }

  // Fallback 3: gender + staff fallback
  if (genderFallback && staffFallback !== staffTier) {
    attempts.push({
      desc: `gender+staff_fallback: v=${variantId} a=${selector.audience} t=${staffFallback} g=${genderFallback}`,
      filter: (r) =>
        r.service_variant_id === variantId &&
        r.audience === selector.audience &&
        r.staff_tier === staffFallback &&
        r.gender_scope === genderFallback,
    });
  }

  // Fallback 4: variant=null (session-level pricing)
  if (variantId !== null) {
    attempts.push({
      desc: `no_variant: a=${selector.audience} t=${staffTier} g=${gender}`,
      filter: (r) =>
        r.service_variant_id === null &&
        r.audience === selector.audience &&
        r.staff_tier === staffTier &&
        r.gender_scope === gender,
    });
  }

  // Fallback 5: regular audience if vip not found
  if (selector.audience === 'vip') {
    attempts.push({
      desc: `regular_fallback: v=${variantId} a=regular t=${staffTier} g=${gender}`,
      filter: (r) =>
        r.service_variant_id === variantId &&
        r.audience === 'regular' &&
        r.staff_tier === staffTier &&
        r.gender_scope === gender,
    });
  }

  for (const attempt of attempts) {
    const matches = matrix.filter(attempt.filter);
    const available = matches.filter((r) => r.is_available);
    if (available.length > 0) {
      const row = available[0];
      const warnings: string[] = [];
      if (row.needs_verification) {
        warnings.push('Price pending verification — confirm with front desk');
      }
      return {
        price_rule_id: row.id,
        amount: row.amount * quantity,
        audience: row.audience,
        staff_tier: row.staff_tier,
        gender_scope: row.gender_scope,
        variant_id: row.service_variant_id,
        is_available: row.is_available,
        needs_verification: row.needs_verification,
        source_ref: row.source_ref,
        warnings,
      };
    }
  }

  return null;
}

export function applyMembershipDiscount(
  baseAmount: number,
  eligibleCategories: string[] | null,
  serviceCategory: string,
  discountPct: number | null
): { discounted: number; discount: number; applied: boolean } {
  if (!eligibleCategories || eligibleCategories.length === 0) {
    if (discountPct && discountPct > 0) {
      const discount = roundPeso(baseAmount * (discountPct / 100));
      return { discounted: roundPeso(baseAmount - discount), discount, applied: true };
    }
    return { discounted: baseAmount, discount: 0, applied: false };
  }

  const categoryMatch = eligibleCategories.some(
    (c) => c.toLowerCase() === serviceCategory.toLowerCase()
  );

  if (categoryMatch && discountPct && discountPct > 0) {
    const discount = roundPeso(baseAmount * (discountPct / 100));
    return { discounted: roundPeso(baseAmount - discount), discount, applied: true };
  }

  return { discounted: baseAmount, discount: 0, applied: false };
}

export function computePerDay(price: number, termMonths: number): number {
  const days = termMonths * 30.44;
  return roundPeso(price / days);
}

export function computeInstallments(
  price: number,
  option: InstallmentOption
): InstallmentResult {
  const downPayment = roundPeso(price * (option.down_payment_pct / 100));
  const remaining = roundPeso(price - downPayment);
  const monthlyPayment = roundPeso(remaining / option.months);

  return {
    down_payment: downPayment,
    monthly_payment: monthlyPayment,
    total: price,
    months: option.months,
  };
}

export { roundPeso };
