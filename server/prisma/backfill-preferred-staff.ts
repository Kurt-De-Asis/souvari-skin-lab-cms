import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Backfilling preferred_staff_id from first non-cancelled appointment per customer...\n');

  const customers = await prisma.customers.findMany({
    where: { preferred_staff_id: null, deleted_at: null },
    select: { id: true, first_name: true, last_name: true },
  });

  console.log(`Found ${customers.length} customers without a preferred staff.`);

  let updated = 0;
  for (const c of customers) {
    const firstApt = await prisma.appointments.findFirst({
      where: {
        customer_id: c.id,
        status: { notIn: ['cancelled', 'no_show'] },
      },
      orderBy: [{ appointment_date: 'asc' }, { created_at: 'asc' }],
      select: { staff_id: true },
    });

    if (firstApt?.staff_id) {
      await prisma.customers.update({
        where: { id: c.id },
        data: { preferred_staff_id: firstApt.staff_id },
      });
      console.log(`  ${c.first_name} ${c.last_name} → staff ${firstApt.staff_id}`);
      updated++;
    }
  }

  console.log(`\nDone. Updated ${updated} of ${customers.length} customers.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
