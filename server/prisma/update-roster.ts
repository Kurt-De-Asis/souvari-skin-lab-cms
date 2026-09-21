import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;
const OFF = '00:00';

interface RosterEntry {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  jobTitle: string;
  permissionLevel: string;
  schedule: Array<{ day: string; start: string; end: string }>;
}

// Target roster — rest days are simply not listed in `schedule`.
const roster: RosterEntry[] = [
  {
    firstName: 'Rica',
    lastName: 'Coronel',
    email: 'coronelcassandria@gmail.com',
    phone: '+639676630207',
    position: 'nail_technician',
    jobTitle: 'Nail Technician',
    permissionLevel: 'medium',
    schedule: [
      { day: 'tuesday', start: '10:00', end: '20:00' },
      { day: 'thursday', start: '10:00', end: '20:00' },
      { day: 'friday', start: '10:00', end: '20:00' },
      { day: 'saturday', start: '10:00', end: '20:00' },
      { day: 'sunday', start: '10:00', end: '20:00' },
    ],
  },
  {
    firstName: 'Wendy Jane',
    lastName: 'Puti-An',
    email: 'wendyjaneputian@gmail.com',
    phone: '+639173851616',
    position: 'nail_technician',
    jobTitle: 'Nail Technician',
    permissionLevel: 'medium',
    schedule: [
      { day: 'monday', start: '10:00', end: '20:00' },
      { day: 'wednesday', start: '10:00', end: '20:00' },
      { day: 'friday', start: '10:00', end: '20:00' },
      { day: 'saturday', start: '10:00', end: '20:00' },
      { day: 'sunday', start: '10:00', end: '20:00' },
    ],
  },
  {
    firstName: 'Jobelle',
    lastName: 'Cabanig',
    email: 'lumayajobelle@gmail.com',
    phone: '+639541547410',
    position: 'facialist',
    jobTitle: 'Facialist',
    permissionLevel: 'medium',
    schedule: [
      { day: 'monday', start: '10:00', end: '20:00' },
      { day: 'wednesday', start: '10:00', end: '20:00' },
      { day: 'friday', start: '10:00', end: '20:00' },
      { day: 'saturday', start: '10:00', end: '20:00' },
      { day: 'sunday', start: '10:00', end: '20:00' },
    ],
  },
  {
    firstName: 'Princess Ashly',
    lastName: 'Diauna',
    email: 'princessdiuna3@gmail.com',
    phone: '+639959582764',
    position: 'nail_and_skin_care_specialist',
    jobTitle: 'Nail and Skin Care Specialist',
    permissionLevel: 'medium',
    schedule: [
      { day: 'wednesday', start: '11:00', end: '20:00' },
      { day: 'thursday', start: '11:00', end: '20:00' },
      { day: 'friday', start: '11:00', end: '20:00' },
    ],
  },
  {
    firstName: 'Gian Heart',
    lastName: 'Daygon',
    email: 'gianheartdaygon24@gmail.com',
    phone: '+63199631651',
    position: 'nail_and_skin_care_specialist',
    jobTitle: 'Nail and Skin Care Specialist',
    permissionLevel: 'medium',
    schedule: [
      { day: 'wednesday', start: '11:00', end: '20:00' },
      { day: 'thursday', start: '11:00', end: '20:00' },
      { day: 'friday', start: '11:00', end: '20:00' },
    ],
  },
  {
    firstName: 'Queenie',
    lastName: 'Feliciano',
    email: 'queenie.feliciano@souvari.local',
    phone: '+639000000001',
    position: 'clinic_head_nurse',
    jobTitle: 'Clinic Head Nurse',
    permissionLevel: 'medium',
    schedule: [
      { day: 'wednesday', start: '12:00', end: '20:00' },
      { day: 'thursday', start: '12:00', end: '20:00' },
      { day: 'friday', start: '12:00', end: '20:00' },
      { day: 'saturday', start: '12:00', end: '20:00' },
      { day: 'sunday', start: '12:00', end: '20:00' },
    ],
  },
];

async function upsertStaff(config: RosterEntry, passwordHash: string) {
  let user = await prisma.users.findUnique({ where: { email: config.email } });
  if (!user) {
    user = await prisma.users.create({
      data: {
        email: config.email,
        password_hash: passwordHash,
        role: 'staff',
        status: 'active',
        phone: config.phone,
      },
    });
  }

  const existing = await prisma.staff.findFirst({
    where: { user_id: user.id },
  });

  let staff;
  if (existing) {
    staff = await prisma.staff.update({
      where: { id: existing.id },
      data: {
        first_name: config.firstName,
        last_name: config.lastName,
        position: config.position as any,
        job_title: config.jobTitle,
        permission_level: config.permissionLevel,
        status: 'active',
        deleted_at: null,
      },
    });
  } else {
    staff = await prisma.staff.create({
      data: {
        user_id: user.id,
        first_name: config.firstName,
        last_name: config.lastName,
        position: config.position as any,
        job_title: config.jobTitle,
        permission_level: config.permissionLevel,
        status: 'active',
      },
    });
  }

  // Replace schedules with full 7-day rows; rest days → 00:00-00:00
  await prisma.staff_schedules.deleteMany({ where: { staff_id: staff.id } });
  const scheduleSet = new Map(config.schedule.map((s) => [s.day, s]));
  for (const day of DAY_ORDER) {
    const sched = scheduleSet.get(day);
    await prisma.staff_schedules.create({
      data: {
        staff_id: staff.id,
        day_of_week: day,
        start_time: sched?.start ?? OFF,
        end_time: sched?.end ?? OFF,
        break_start: null,
        break_end: null,
        is_active: true,
      },
    });
  }

  return staff;
}

async function main() {
  console.log('=== 7-Employee Roster Script ===\n');

  const passwordHash = await bcrypt.hash('password123', 12);

  // 1. Upsert the 6 working staff
  const keepStaffIds: number[] = [];
  for (const entry of roster) {
    const staff = await upsertStaff(entry, passwordHash);
    keepStaffIds.push(staff.id);
    const working = entry.schedule.map((s) => s.day).join(', ');
    console.log(`  ✓ ${entry.firstName} ${entry.lastName} — ${entry.jobTitle} (${working})`);
  }

  // 2. Dennice Anne Imanil — Head/Admin of the System, linked to admin user, NO calendars
  console.log('\n  Setting Head/Admin profile...');
  const adminUser = await prisma.users.findFirst({ where: { role: 'admin' } });
  if (adminUser) {
    const existing = await prisma.staff.findFirst({ where: { user_id: adminUser.id } });
    let dennice;
    if (existing) {
      dennice = await prisma.staff.update({
        where: { id: existing.id },
        data: {
          first_name: 'Dennice Anne',
          last_name: 'Imanil',
          position: 'head_admin' as any,
          job_title: 'Head/Admin of the System',
          permission_level: 'owner',
          status: 'active',
          deleted_at: null,
        },
      });
    } else {
      dennice = await prisma.staff.create({
        data: {
          user_id: adminUser.id,
          first_name: 'Dennice Anne',
          last_name: 'Imanil',
          position: 'head_admin' as any,
          job_title: 'Head/Admin of the System',
          permission_level: 'owner',
          status: 'active',
        },
      });
    }
    // No calendar entries for head admin
    await prisma.staff_schedules.deleteMany({ where: { staff_id: dennice.id } });
    keepStaffIds.push(dennice.id);
    console.log(`  ✓ Dennice Anne Imanil — Head/Admin of the System (no calendar) — staff id ${dennice.id}`);
  } else {
    console.log('  ⚠ No admin user found — skipping Dennice');
  }

  // 3. Remove everyone not in the roster (soft-delete + deactivate login)
  console.log('\n  Removing staff not on the roster...');
  const allStaff = await prisma.staff.findMany({ where: { deleted_at: null } });
  const toRemove = allStaff.filter((s) => !keepStaffIds.includes(s.id));
  const removals = new Set<number>();
  for (const s of toRemove) {
    if (removals.has(s.id)) continue;
    removals.add(s.id);
    await prisma.staff.update({
      where: { id: s.id },
      data: { deleted_at: new Date(), status: 'inactive' },
    });
    await prisma.service_staff.deleteMany({ where: { staff_id: s.id } });
    const u = await prisma.staff.findUnique({ where: { id: s.id } });
    if (u && u.user_id) {
      await prisma.users.update({ where: { id: u.user_id }, data: { status: 'inactive' } });
      await prisma.notifications.deleteMany({ where: { user_id: u.user_id } });
    }
    console.log(`  ✕ Removed ${s.first_name} ${s.last_name} (staff id ${s.id})`);
  }
  if (toRemove.length === 0) console.log('  (nothing to remove)');

  // 4. Verify
  console.log('\n=== Verification ===');
  const staffNow = await prisma.staff.findMany({
    where: { deleted_at: null, status: 'active' },
    include: { schedules: true, user: { select: { email: true, role: true } } },
    orderBy: { id: 'asc' },
  });
  for (const s of staffNow) {
    const working = (s.schedules || [])
      .filter((sc) => sc.start_time !== OFF || sc.end_time !== OFF)
      .map((sc) => sc.day_of_week)
      .join(', ');
    console.log(`  ${s.first_name} ${s.last_name} | ${s.position} | ${s.job_title} | cal: ${working || 'none'}`);
  }

  console.log('\n✓ Done!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });