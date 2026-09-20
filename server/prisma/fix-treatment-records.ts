import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const completed = await prisma.appointments.findMany({
    where: { status: 'completed', deleted_at: null },
    select: {
      id: true,
      staff_id: true,
      customer_id: true,
      service_id: true,
      appointment_date: true,
      start_time: true,
      end_time: true,
      notes: true,
    },
  });

  let created = 0;
  let skipped = 0;

  for (const appt of completed) {
    const exists = await prisma.treatment_records.findUnique({
      where: { appointment_id: appt.id },
      select: { id: true },
    });

    if (exists) {
      skipped++;
      continue;
    }

    await prisma.treatment_records.create({
      data: {
        appointment_id: appt.id,
        staff_id: appt.staff_id,
        customer_id: appt.customer_id,
        service_id: appt.service_id,
        treatment_date: appt.appointment_date,
        start_time: appt.start_time ?? null,
        end_time: appt.end_time ?? null,
        notes: appt.notes ?? null,
      },
    });
    created++;
  }

  console.log(`Backfill complete: ${created} records created, ${skipped} skipped (already existed), ${completed.length} completed appointments total.`);
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });