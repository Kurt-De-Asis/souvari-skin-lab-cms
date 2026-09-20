import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const plansData = [
  // VIP Elite Platinum - Student
  { familyCode: 'VIP_ELITE_PLATINUM', name: 'VIP Elite Platinum - Student', tier: 'ELITE', variant: 'student', term: 6, maxPersons: 1, regular: 1999, promo: 1999, advertisedDay: 333.17 },
  { familyCode: 'VIP_ELITE_PLATINUM', name: 'VIP Elite Platinum - Student', tier: 'ELITE', variant: 'student', term: 12, maxPersons: 1, regular: 1999, promo: 1999, advertisedDay: 274.88 },
  { familyCode: 'VIP_ELITE_PLATINUM', name: 'VIP Elite Platinum - Student', tier: 'ELITE', variant: 'student', term: 13, maxPersons: 1, regular: 1999, promo: 1999, advertisedDay: 249.39 },

  // VIP Elite Platinum - Single
  { familyCode: 'VIP_ELITE_PLATINUM', name: 'VIP Elite Platinum - Single', tier: 'ELITE', variant: 'single', term: 6, maxPersons: 1, regular: 6999, promo: 6999, advertisedDay: 1166.50 },
  { familyCode: 'VIP_ELITE_PLATINUM', name: 'VIP Elite Platinum - Single', tier: 'ELITE', variant: 'single', term: 12, maxPersons: 1, regular: 6999, promo: 6999, advertisedDay: 972.08 },
  { familyCode: 'VIP_ELITE_PLATINUM', name: 'VIP Elite Platinum - Single', tier: 'ELITE', variant: 'single', term: 13, maxPersons: 1, regular: 6999, promo: 6999, advertisedDay: 883.71 },

  // VIP Elite Platinum - Duo
  { familyCode: 'VIP_ELITE_PLATINUM', name: 'VIP Elite Platinum - Duo', tier: 'ELITE', variant: 'duo', term: 6, maxPersons: 2, regular: 9999, promo: 9999, advertisedDay: 1666.50 },
  { familyCode: 'VIP_ELITE_PLATINUM', name: 'VIP Elite Platinum - Duo', tier: 'ELITE', variant: 'duo', term: 12, maxPersons: 2, regular: 9999, promo: 9999, advertisedDay: 1388.75 },
  { familyCode: 'VIP_ELITE_PLATINUM', name: 'VIP Elite Platinum - Duo', tier: 'ELITE', variant: 'duo', term: 13, maxPersons: 2, regular: 9999, promo: 9999, advertisedDay: 1262.56 },

  // VIP Elite Platinum - Family
  { familyCode: 'VIP_ELITE_PLATINUM', name: 'VIP Elite Platinum - Family', tier: 'ELITE', variant: 'family', term: 6, maxPersons: 3, regular: 12999, promo: 12999, advertisedDay: 2166.50 },
  { familyCode: 'VIP_ELITE_PLATINUM', name: 'VIP Elite Platinum - Family', tier: 'ELITE', variant: 'family', term: 12, maxPersons: 3, regular: 12999, promo: 12999, advertisedDay: 1805.42 },
  { familyCode: 'VIP_ELITE_PLATINUM', name: 'VIP Elite Platinum - Family', tier: 'ELITE', variant: 'family', term: 13, maxPersons: 3, regular: 12999, promo: 12999, advertisedDay: 1641.29 },

  // VIP Elite Platinum - Add-On
  { familyCode: 'VIP_ELITE_PLATINUM', name: 'VIP Elite Platinum - Add-On', tier: 'ELITE', variant: 'add_on', term: 6, maxPersons: 1, regular: 1999, promo: 1999, advertisedDay: 333.17 },
  { familyCode: 'VIP_ELITE_PLATINUM', name: 'VIP Elite Platinum - Add-On', tier: 'ELITE', variant: 'add_on', term: 12, maxPersons: 1, regular: 1999, promo: 1999, advertisedDay: 274.88 },

  // VIP Radiant Skin - Single
  { familyCode: 'VIP_RADIANT_SKIN', name: 'VIP Radiant Skin - Single', tier: 'PLATINUM', variant: 'single', term: 6, maxPersons: 1, regular: 4999, promo: 4999, advertisedDay: 833.17 },
  { familyCode: 'VIP_RADIANT_SKIN', name: 'VIP Radiant Skin - Single', tier: 'PLATINUM', variant: 'single', term: 12, maxPersons: 1, regular: 4999, promo: 4999, advertisedDay: 694.31 },
  { familyCode: 'VIP_RADIANT_SKIN', name: 'VIP Radiant Skin - Single', tier: 'PLATINUM', variant: 'single', term: 13, maxPersons: 1, regular: 4999, promo: 4999, advertisedDay: 630.64 },

  // VIP Radiant Skin - Duo
  { familyCode: 'VIP_RADIANT_SKIN', name: 'VIP Radiant Skin - Duo', tier: 'PLATINUM', variant: 'duo', term: 6, maxPersons: 2, regular: 7999, promo: 7999, advertisedDay: 1333.17 },
  { familyCode: 'VIP_RADIANT_SKIN', name: 'VIP Radiant Skin - Duo', tier: 'PLATINUM', variant: 'duo', term: 12, maxPersons: 2, regular: 7999, promo: 7999, advertisedDay: 1111.04 },
  { familyCode: 'VIP_RADIANT_SKIN', name: 'VIP Radiant Skin - Duo', tier: 'PLATINUM', variant: 'duo', term: 13, maxPersons: 2, regular: 7999, promo: 7999, advertisedDay: 1012.69 },

  // VIP Radiant Skin - Family
  { familyCode: 'VIP_RADIANT_SKIN', name: 'VIP Radiant Skin - Family', tier: 'PLATINUM', variant: 'family', term: 6, maxPersons: 3, regular: 8999, promo: 8999, advertisedDay: 1499.83 },
  { familyCode: 'VIP_RADIANT_SKIN', name: 'VIP Radiant Skin - Family', tier: 'PLATINUM', variant: 'family', term: 12, maxPersons: 3, regular: 8999, promo: 8999, advertisedDay: 1249.86 },
  { familyCode: 'VIP_RADIANT_SKIN', name: 'VIP Radiant Skin - Family', tier: 'PLATINUM', variant: 'family', term: 13, maxPersons: 3, regular: 8999, promo: 8999, advertisedDay: 1140.90 },

  // VIP Radiant Skin - Add-On
  { familyCode: 'VIP_RADIANT_SKIN', name: 'VIP Radiant Skin - Add-On', tier: 'PLATINUM', variant: 'add_on', term: 6, maxPersons: 1, regular: 1999, promo: 1999, advertisedDay: 333.17 },
  { familyCode: 'VIP_RADIANT_SKIN', name: 'VIP Radiant Skin - Add-On', tier: 'PLATINUM', variant: 'add_on', term: 12, maxPersons: 1, regular: 1999, promo: 1999, advertisedDay: 274.88 },

  // VIP Lash & Nail - Single
  { familyCode: 'VIP_LASH_NAIL', name: 'VIP Lash & Nail - Single', tier: 'GOLD', variant: 'single', term: 6, maxPersons: 1, regular: 4999, promo: 4999, advertisedDay: 833.17 },
  { familyCode: 'VIP_LASH_NAIL', name: 'VIP Lash & Nail - Single', tier: 'GOLD', variant: 'single', term: 12, maxPersons: 1, regular: 4999, promo: 4999, advertisedDay: 694.31 },
  { familyCode: 'VIP_LASH_NAIL', name: 'VIP Lash & Nail - Single', tier: 'GOLD', variant: 'single', term: 13, maxPersons: 1, regular: 4999, promo: 4999, advertisedDay: 630.64 },

  // VIP Lash & Nail - Duo
  { familyCode: 'VIP_LASH_NAIL', name: 'VIP Lash & Nail - Duo', tier: 'GOLD', variant: 'duo', term: 6, maxPersons: 2, regular: 7999, promo: 7999, advertisedDay: 1333.17 },
  { familyCode: 'VIP_LASH_NAIL', name: 'VIP Lash & Nail - Duo', tier: 'GOLD', variant: 'duo', term: 12, maxPersons: 2, regular: 7999, promo: 7999, advertisedDay: 1111.04 },
  { familyCode: 'VIP_LASH_NAIL', name: 'VIP Lash & Nail - Duo', tier: 'GOLD', variant: 'duo', term: 13, maxPersons: 2, regular: 7999, promo: 7999, advertisedDay: 1012.69 },

  // VIP Lash & Nail - Family
  { familyCode: 'VIP_LASH_NAIL', name: 'VIP Lash & Nail - Family', tier: 'GOLD', variant: 'family', term: 6, maxPersons: 3, regular: 8999, promo: 8999, advertisedDay: 1499.83 },
  { familyCode: 'VIP_LASH_NAIL', name: 'VIP Lash & Nail - Family', tier: 'GOLD', variant: 'family', term: 12, maxPersons: 3, regular: 8999, promo: 8999, advertisedDay: 1249.86 },
  { familyCode: 'VIP_LASH_NAIL', name: 'VIP Lash & Nail - Family', tier: 'GOLD', variant: 'family', term: 13, maxPersons: 3, regular: 8999, promo: 8999, advertisedDay: 1140.90 },

  // VIP Lash & Nail - Add-On
  { familyCode: 'VIP_LASH_NAIL', name: 'VIP Lash & Nail - Add-On', tier: 'GOLD', variant: 'add_on', term: 6, maxPersons: 1, regular: 1999, promo: 1999, advertisedDay: 333.17 },
  { familyCode: 'VIP_LASH_NAIL', name: 'VIP Lash & Nail - Add-On', tier: 'GOLD', variant: 'add_on', term: 12, maxPersons: 1, regular: 1999, promo: 1999, advertisedDay: 274.88 },

  // Silver Access - Single
  { familyCode: 'SILVER_ACCESS', name: 'Silver Access - Single', tier: 'SILVER', variant: 'single', term: 13, maxPersons: 1, regular: 1999, promo: 1999, advertisedDay: 153.77 },

  // Silver Access - Duo
  { familyCode: 'SILVER_ACCESS', name: 'Silver Access - Duo', tier: 'SILVER', variant: 'duo', term: 13, maxPersons: 2, regular: 2999, promo: 2999, advertisedDay: 230.69 },
];

const baseBenefits = [
  { name: 'VIP Booking Priority', description: 'Priority booking for all services', benefit_type: 'booking', sort_order: 1 },
  { name: '20% Off Threading', description: '20% discount on all threading services', benefit_type: 'discount', discount_pct: 20, eligible_categories: ['Threading'], sort_order: 2 },
  { name: 'Waived Booking Fee', description: 'No booking fee for appointments', benefit_type: 'fee_waiver', sort_order: 3 },
  { name: 'Monthly Perk Credit', description: 'Monthly service credit (max value)', benefit_type: 'monthly_credit', config: { max_value: 300, min_spend: 800 }, sort_order: 4 },
  { name: 'VIP Events Access', description: 'Exclusive access to VIP events and previews', benefit_type: 'access', sort_order: 5 },
  { name: 'Birthday Treatment', description: 'Free birthday treatment', benefit_type: 'birthday', sort_order: 6 },
  { name: 'Gold Raffle Entry', description: 'Automatic entry to gold raffle', benefit_type: 'raffle', sort_order: 9 },
  { name: 'Renewal Extension', description: '180-day extension on renewal threshold', benefit_type: 'renewal', config: { extension_days: 180 }, sort_order: 10 },
];

const eliteBenefits = [
  ...baseBenefits,
  { name: '25% Off Whitening & Scar', description: '25% off whitening, scar camouflage, freckle tattoo, PMU', benefit_type: 'discount', discount_pct: 25, eligible_categories: ['Whitening', 'Permanent Makeup'], sort_order: 11 },
  { name: 'VIP Concierge', description: 'Dedicated VIP concierge service', benefit_type: 'access', sort_order: 12 },
  { name: '₱1,999 Nail Art Fixed Price', description: 'Nail art at fixed ₱1,999 for VIP members', benefit_type: 'fixed_price', fixed_price: 1999, eligible_categories: ['Nails'], sort_order: 13 },
  { name: 'Free Lash Tint', description: 'Complimentary lash tint service', benefit_type: 'free_service', eligible_categories: ['Lash & Brow'], sort_order: 14 },
  { name: 'Free Lash Refill (VIP Only)', description: 'Free lash refill - certified technician only', benefit_type: 'free_service', eligible_categories: ['Lash & Brow'], config: { restriction: 'certified_tech_only', vip_only: true }, sort_order: 15 },
  { name: 'Monthly Brow Voucher', description: 'Monthly ₱500 brow service voucher', benefit_type: 'monthly_credit', config: { amount: 500, eligible_categories: ['Lash & Brow'] }, sort_order: 16 },
  { name: '1 Free Add-On Per Term', description: 'One complimentary add-on service per membership term', benefit_type: 'free_service', config: { max_per_term: 1 }, sort_order: 17 },
];

const radiantSkinBenefits = [
  ...baseBenefits,
  { name: '25% Off Skin Treatments', description: '25% off facials, laser, HIFU, whitening, scar, carbon', benefit_type: 'discount', discount_pct: 25, eligible_categories: ['Facial Glow', 'Whitening', 'Lifting & Tightening', 'Laser', 'Permanent Makeup', 'Rejuvenation'], sort_order: 11 },
  { name: '₱200 Skin Credit', description: 'Monthly ₱200 credit for skin services', benefit_type: 'monthly_credit', config: { amount: 200, eligible_categories: ['Facial Glow', 'Whitening', 'Rejuvenation'] }, sort_order: 12 },
  { name: 'Free LED Treatment', description: 'Complimentary LED light therapy', benefit_type: 'free_service', eligible_categories: ['Facial Glow', 'Rejuvenation'], sort_order: 13 },
];

const lashNailBenefits = [
  ...baseBenefits,
  { name: '25% Off Lash & Nail', description: '25% off nail, lash, and brow services', benefit_type: 'discount', discount_pct: 25, eligible_categories: ['Nails', 'Lash & Brow'], sort_order: 11 },
  { name: '₱1,999 Nail Art Fixed Price', description: 'Nail art at fixed ₱1,999 for VIP members', benefit_type: 'fixed_price', fixed_price: 1999, eligible_categories: ['Nails'], sort_order: 12 },
  { name: 'Extended Lash Refill Window', description: 'Extended refill period for lash extensions', benefit_type: 'extended_refill', eligible_categories: ['Lash & Brow'], sort_order: 13 },
];

const silverBenefits = [
  { name: '15% Off Eligible Services', description: '15% off threading, lash & brow, nails, waxing', benefit_type: 'discount', discount_pct: 15, eligible_categories: ['Threading', 'Lash & Brow', 'Nails', 'Waxing'], sort_order: 1 },
  { name: 'Flash Sale Access', description: 'Access to exclusive flash sales', benefit_type: 'access', sort_order: 2 },
  { name: 'Birthday Voucher', description: 'Birthday discount voucher', benefit_type: 'birthday', sort_order: 3 },
];

function getBenefitsForFamily(code: string) {
  switch (code) {
    case 'VIP_ELITE_PLATINUM': return eliteBenefits;
    case 'VIP_RADIANT_SKIN': return radiantSkinBenefits;
    case 'VIP_LASH_NAIL': return lashNailBenefits;
    case 'SILVER_ACCESS': return silverBenefits;
    default: return baseBenefits;
  }
}

async function main() {
  console.log('=== Membership Seed ===');

  // Seed plans (find-or-create so member/plan links survive re-runs)
  console.log('Seeding membership plans...');
  let planCount = 0;
  const planMap = new Map<string, number>();

  for (const p of plansData) {
    const computedDay = p.promo / (p.term * 30.44);

    const existing = await prisma.membership_plans.findFirst({
      where: { name: p.name, tier: p.tier as any, variant_code: p.variant as any, term_months: p.term },
    });
    const plan = existing ?? (await prisma.membership_plans.create({
      data: {
        name: p.name,
        tier: p.tier as any,
        duration_months: p.term,
        regular_price: p.regular,
        promo_price: p.promo,
        description: null,
        is_active: true,
        variant_code: p.variant as any,
        term_months: p.term,
        max_persons: p.maxPersons,
        advertised_per_day_price: p.advertisedDay,
        computed_per_day_price: Math.round(computedDay * 100) / 100,
        sort_order: planCount,
      },
    }));
    if (existing) {
      await prisma.membership_plans.update({
        where: { id: existing.id },
        data: {
          regular_price: p.regular,
          promo_price: p.promo,
          duration_months: p.term,
          max_persons: p.maxPersons,
          advertised_per_day_price: p.advertisedDay,
          computed_per_day_price: Math.round(computedDay * 100) / 100,
          is_active: true,
          sort_order: planCount,
        },
      });
    }
    planMap.set(`${p.familyCode}-${p.variant}-${p.term}`, plan.id);
    planCount++;
  }
  console.log(`  ${planCount} plans seeded.`);

  // Seed benefits (reset then attach per plan, grouped by tier/family-code benefits)
  console.log('Seeding membership benefits...');
  await prisma.membership_benefits.deleteMany({});
  let benefitCount = 0;
  const seen = new Set<string>();
  for (const p of plansData) {
    const planId = planMap.get(`${p.familyCode}-${p.variant}-${p.term}`);
    if (!planId) continue;

    const benefits = getBenefitsForFamily(p.familyCode);
    for (const b of benefits) {
      const key = `${planId}:${b.name}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const bb = b as any;
      await prisma.membership_benefits.create({
        data: {
          membership_plan_id: planId,
          name: bb.name,
          description: bb.description,
          benefit_type: bb.benefit_type,
          discount_pct: bb.discount_pct ?? null,
          discount_amount: null,
          fixed_price: bb.fixed_price ?? null,
          eligible_categories: bb.eligible_categories ?? Prisma.JsonNull,
          config: bb.config ?? null,
          is_active: true,
          sort_order: bb.sort_order,
        },
      });
      benefitCount++;
    }
  }
  console.log(`  ${benefitCount} benefits seeded.`);

  // Seed installment options
  console.log('Seeding installment options...');
  let installmentCount = 0;
  for (const p of plansData) {
    const key = `${p.familyCode}-${p.variant}-${p.term}`;
    const planId = planMap.get(key);
    if (!planId) continue;

    // 3-month installment
    await prisma.membership_installment_options.upsert({
      where: { plan_id_months: { plan_id: planId, months: 3 } },
      update: {},
      create: { plan_id: planId, down_payment_pct: 30, months: 3, payment_method: 'cash', is_active: true },
    });
    installmentCount++;

    // 6-month installment
    await prisma.membership_installment_options.upsert({
      where: { plan_id_months: { plan_id: planId, months: 6 } },
      update: {},
      create: { plan_id: planId, down_payment_pct: 30, months: 6, payment_method: 'cash', is_active: true },
    });
    installmentCount++;
  }
  console.log(`  ${installmentCount} installment options seeded.`);

  console.log('=== Membership Seed Complete ===');
}

main()
  .catch((e) => {
    console.error('Membership seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
