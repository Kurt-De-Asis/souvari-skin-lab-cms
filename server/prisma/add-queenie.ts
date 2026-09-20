import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.users.findUnique({ where: { email: 'queenie.feliciano@souvari.local' } });
  if (existing) {
    console.log('Queenie already exists (user_id=' + existing.id + '), skipping.');
    await prisma.$disconnect();
    return;
  }

  const hash = await bcrypt.hash('password123', 12);

  const user = await prisma.users.create({
    data: {
      email: 'queenie.feliciano@souvari.local',
      password_hash: hash,
      role: 'staff',
      status: 'active',
      phone: '+639000000001',
    },
  });

  const staff = await prisma.staff.create({
    data: {
      user_id: user.id,
      first_name: 'Queenie Rose',
      last_name: 'Feliciano',
      position: 'nurse' as any,
      job_title: 'Clinic Nurse',
      permission_level: 'medium',
      status: 'active',
    },
  });

  // Mon–Sat 10:00–20:00, Sunday off
  const days: Array<{ day: string; start: string; end: string }> = [
    { day: 'sunday',    start: '00:00', end: '00:00' },
    { day: 'monday',    start: '10:00', end: '20:00' },
    { day: 'tuesday',   start: '10:00', end: '20:00' },
    { day: 'wednesday', start: '10:00', end: '20:00' },
    { day: 'thursday',  start: '10:00', end: '20:00' },
    { day: 'friday',    start: '10:00', end: '20:00' },
    { day: 'saturday',  start: '10:00', end: '20:00' },
  ];

  for (const d of days) {
    await prisma.staff_schedules.create({
      data: {
        staff_id: staff.id,
        day_of_week: d.day as any,
        start_time: d.start,
        end_time: d.end,
        is_active: true,
      },
    });
  }

  console.log('Created Queenie Rose Feliciano (nurse) — user_id=' + user.id + ' staff_id=' + staff.id);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
