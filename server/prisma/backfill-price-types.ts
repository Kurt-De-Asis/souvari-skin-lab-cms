import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Backfill price_type on historical records ===');

  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const memberships = await prisma.memberships.findMany({
    where: {
      status: 'active',
      end_date: { gte: today },
    },
    select: { customer_id: true },
  });

  const vipCustomerIds = new Set(memberships.map((m) => m.customer_id));
  console.log(`  ${vipCustomerIds.size} customers with active non-expired memberships`);

  // Backfill appointments
  const appts = await prisma.appointments.findMany({
    where: { price_type: null, status: { not: 'cancelled' } },
    select: { id: true, customer_id: true },
  });

  let apptUpdated = 0;
  for (const a of appts) {
    const priceType = vipCustomerIds.has(a.customer_id) ? 'vip' : 'non_member';
    await prisma.appointments.update({
      where: { id: a.id },
      data: { price_type: priceType },
    });
    apptUpdated++;
  }
  console.log(`  ${apptUpdated} appointments backfilled with price_type`);

  // Backfill transaction_items via their transactions
  const txItems = await prisma.transaction_items.findMany({
    where: { price_type: null },
    select: {
      id: true,
      transaction: { select: { customer_id: true, type: true } },
    },
  });

  let itemUpdated = 0;
  let skipped = 0;
  for (const item of txItems) {
    const customerId = item.transaction?.customer_id;
    if (!customerId) {
      skipped++;
      continue;
    }
    const priceType = vipCustomerIds.has(customerId) ? 'vip' : 'non_member';
    await prisma.transaction_items.update({
      where: { id: item.id },
      data: { price_type: priceType },
    });
    itemUpdated++;
  }
  console.log(`  ${itemUpdated} transaction_items backfilled (${skipped} skipped without customer)`);

  console.log('=== Backfill complete ===');
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });