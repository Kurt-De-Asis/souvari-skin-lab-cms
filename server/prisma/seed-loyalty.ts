import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const milestoneSets: Record<string, Array<{ spend: number; reward: number; label: string }>> = {
  SILVER: [
    { spend: 2000, reward: 2, label: '2% Reward' },
    { spend: 6000, reward: 5, label: '5% Reward' },
    { spend: 15000, reward: 8, label: '8% Reward' },
  ],
  GOLD: [
    { spend: 3000, reward: 3, label: '3% Reward' },
    { spend: 9000, reward: 7, label: '7% Reward' },
    { spend: 20000, reward: 10, label: '10% Reward' },
  ],
  PLATINUM: [
    { spend: 4000, reward: 4, label: '4% Reward' },
    { spend: 12000, reward: 8, label: '8% Reward' },
    { spend: 25000, reward: 12, label: '12% Reward' },
  ],
  ELITE: [
    { spend: 5000, reward: 5, label: '5% Reward' },
    { spend: 15000, reward: 10, label: '10% Reward' },
    { spend: 30000, reward: 15, label: '15% Reward' },
  ],
};

async function main() {
  console.log('=== Membership Loyalty Seed ===');

  // Loyalty milestones (per tier / plan_type)
  console.log('Seeding loyalty milestones...');
  await prisma.loyalty_milestones.deleteMany({});
  let milestoneCount = 0;
  for (const [planType, rows] of Object.entries(milestoneSets)) {
    for (const m of rows) {
      await prisma.loyalty_milestones.create({
        data: {
          plan_type: planType as any,
          spend_threshold: m.spend,
          reward_pct: m.reward,
          label: m.label,
          is_active: true,
        },
      });
      milestoneCount++;
    }
  }
  console.log(`  ${milestoneCount} milestones seeded.`);

  // Sample qualifying spend for the demo member (membership 5 = Juan Dela Cruz)
  const demoMembership = await prisma.memberships.findUnique({ where: { id: 5 } });
  if (demoMembership) {
    await prisma.loyalty_progress.update({
      where: { membership_id: 5 },
      data: {
        qualifying_spend: 12500,
        total_spend: 12500,
        highest_reward_pct: 5,
      },
    });
    console.log('  Demo membership spend set to ₱12,500 (membership 5).');
  }

  // Recent activity logs (demo data)
  console.log('Seeding membership activity logs...');
  await prisma.membership_activity_logs.deleteMany({});
  const activitySeeds = [
    {
      membership_id: 5,
      action: 'membership_availed',
      details: JSON.stringify({ plan: 'VIP Elite Platinum - Single' }),
      daysAgo: 6,
    },
    {
      membership_id: 5,
      action: 'loyalty_spend_adjusted',
      details: JSON.stringify({ amount: 4500, reason: 'Paid treatments (monthly)', old_qualifying_spend: 0, new_qualifying_spend: 4500 }),
      daysAgo: 4,
    },
    {
      membership_id: 5,
      action: 'perk_used',
      details: JSON.stringify({ year_month: '2026-09', discount_amount: 300, max_value: 300 }),
      daysAgo: 2,
    },
    {
      membership_id: 5,
      action: 'loyalty_spend_adjusted',
      details: JSON.stringify({ amount: 8000, reason: 'Membership renewal credit', old_qualifying_spend: 4500, new_qualifying_spend: 12500 }),
      daysAgo: 1,
    },
    {
      membership_id: 6,
      action: 'membership_availed',
      details: JSON.stringify({ plan: 'VIP Elite Platinum - Single' }),
      daysAgo: 3,
    },
    {
      membership_id: 4,
      action: 'membership_availed',
      details: JSON.stringify({ plan: 'Silver Access - Single' }),
      daysAgo: 5,
    },
  ];

  let logCount = 0;
  for (const seed of activitySeeds) {
    await prisma.membership_activity_logs.create({
      data: {
        membership_id: seed.membership_id,
        action: seed.action,
        details: seed.details,
        performed_by: null,
        created_at: new Date(Date.now() - seed.daysAgo * 24 * 60 * 60 * 1000),
      },
    });
    logCount++;
  }
  console.log(`  ${logCount} activity logs seeded.`);

  console.log('=== Membership Loyalty Seed Complete ===');
}

main()
  .catch((e) => {
    console.error('Loyalty seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });