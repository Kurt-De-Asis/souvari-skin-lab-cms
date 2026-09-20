import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// day_of_week → order column index
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

interface RosterEntry {
  staffId: number;
  position: string;
  jobTitle: string;
  shift: Record<string, { start: string; end: string }>;
}

// Target roster: every staff keeps all 7 schedule rows; off days → 00:00-00:00
const OFF = '00:00';

const roster: RosterEntry[] = [
  {
    staffId: 5, // Gian Heart Daygon
    position: 'nail_and_skin_care_specialist',
    jobTitle: 'Nail and Skin Care Specialist',
    shift: {
      monday: { start: OFF, end: OFF },
      tuesday: { start: OFF, end: OFF },
      wednesday: { start: '11:00', end: '20:00' },
      thursday: { start: '11:00', end: '20:00' },
      friday: { start: '11:00', end: '20:00' },
      saturday: { start: OFF, end: OFF },
      sunday: { start: OFF, end: OFF },
    },
  },
  {
    staffId: 6, // Princess Ashly Diuna
    position: 'nail_and_skin_care_specialist',
    jobTitle: 'Nail and Skin Care Specialist',
    shift: {
      monday: { start: OFF, end: OFF },
      tuesday: { start: OFF, end: OFF },
      wednesday: { start: '11:00', end: '20:00' },
      thursday: { start: '11:00', end: '20:00' },
      friday: { start: '11:00', end: '20:00' },
      saturday: { start: OFF, end: OFF },
      sunday: { start: OFF, end: OFF },
    },
  },
  {
    staffId: 8, // Jobelle Cabanig
    position: 'facialist',
    jobTitle: 'Facialist',
    shift: {
      monday: { start: '10:00', end: '20:00' },
      tuesday: { start: OFF, end: OFF },
      wednesday: { start: '10:00', end: '20:00' },
      thursday: { start: OFF, end: OFF },
      friday: { start: '10:00', end: '20:00' },
      saturday: { start: '10:00', end: '20:00' },
      sunday: { start: '10:00', end: '20:00' },
    },
  },
  {
    staffId: 9, // Rica May Coronel
    position: 'nail_technician',
    jobTitle: 'Nail Technician',
    shift: {
      monday: { start: OFF, end: OFF },
      tuesday: { start: '10:00', end: '20:00' },
      wednesday: { start: OFF, end: OFF },
      thursday: { start: '10:00', end: '20:00' },
      friday: { start: '10:00', end: '20:00' },
      saturday: { start: '10:00', end: '20:00' },
      sunday: { start: '10:00', end: '20:00' },
    },
  },
  {
    staffId: 11, // Wendy Jane Puti-an
    position: 'nail_technician',
    jobTitle: 'Nail Technician',
    shift: {
      monday: { start: '10:00', end: '20:00' },
      tuesday: { start: OFF, end: OFF },
      wednesday: { start: '10:00', end: '20:00' },
      thursday: { start: OFF, end: OFF },
      friday: { start: '10:00', end: '20:00' },
      saturday: { start: '10:00', end: '20:00' },
      sunday: { start: '10:00', end: '20:00' },
    },
  },
  {
    staffId: 12, // Queenie Rose Feliciano
    position: 'clinic_head_nurse',
    jobTitle: 'Clinic Head Nurse',
    shift: {
      monday: { start: OFF, end: OFF },
      tuesday: { start: OFF, end: OFF },
      wednesday: { start: '12:00', end: '20:00' },
      thursday: { start: '12:00', end: '20:00' },
      friday: { start: '12:00', end: '20:00' },
      saturday: { start: '12:00', end: '20:00' },
      sunday: { start: '12:00', end: '20:00' },
    },
  },
];

async function main() {
  console.log('=== Update Roster Script ===\n');

  // 1. Update positions + job titles
  for (const entry of roster) {
    await prisma.staff.update({
      where: { id: entry.staffId },
      data: { position: entry.position as any, job_title: entry.jobTitle },
    });

    // 2. Upsert all 7 schedule rows for this staff
    for (const day of DAY_ORDER) {
      const sched = entry.shift[day];
      await prisma.staff_schedules.upsert({
        where: { staff_id_day_of_week: { staff_id: entry.staffId, day_of_week: day } },
        update: { start_time: sched.start, end_time: sched.end, break_start: null, break_end: null, is_active: true },
        create: { staff_id: entry.staffId, day_of_week: day, start_time: sched.start, end_time: sched.end, break_start: null, break_end: null, is_active: true },
      });
    }

    const working = DAY_ORDER.filter((d) => entry.shift[d].start !== OFF).join(', ');
    console.log(`  ✓ ${entry.jobTitle} — ${entry.jobTitle} (${working})`);
  }

  // 3. Create Dennice Anne Imanil (Head/Admin) linked to admin user, no schedules
  const adminUser = await prisma.users.findFirst({ where: { role: 'admin' } });
  if (adminUser) {
    const existing = await prisma.staff.findUnique({ where: { user_id: adminUser.id } });
    let den: any;
    if (existing) {
      den = await prisma.staff.update({
        where: { id: existing.id },
        data: { first_name: 'Dennice Anne', last_name: 'Imanil', position: 'head_admin' as any, job_title: 'Head/Admin of the System', permission_level: 'owner', status: 'active', deleted_at: null },
      });
      await prisma.staff_schedules.deleteMany({ where: { staff_id: den.id } });
    } else {
      den = await prisma.staff.create({
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
    console.log(`  ✓ Created Dennice Anne Imanil (head_admin, no schedules) — staff id ${den.id}`);
  } else {
    console.log('  ⚠ Admin user not found — skipping Dennice');
  }

  // 4. Reassign Jocelyn's pending appointments
  await prisma.appointments.update({ where: { id: 87 }, data: { staff_id: 5 } }); // Skin Rejuvenation Laser → Gian
  await prisma.appointments.update({ where: { id: 103 }, data: { staff_id: 8 } }); // Classic Facial → Jobelle
  console.log('  ✓ Reassigned appt 87 → Gian Heart, appt 103 → Jobelle');

  // 5. Remove Jocelyn Corpuz (id 7): soft-delete + strip service_staff + deactivate user
  await prisma.staff.update({
    where: { id: 7 },
    data: { deleted_at: new Date(), status: 'inactive' },
  });
  const removedSvc = await prisma.service_staff.deleteMany({ where: { staff_id: 7 } });
  const jocUser = await prisma.staff.findUnique({ where: { id: 7 } });
  if (jocUser) {
    await prisma.users.update({ where: { id: jocUser.user_id }, data: { status: 'inactive' } });
  }
  console.log(`  ✓ Soft-deleted Jocelyn Corpuz; removed ${removedSvc.count} service_staff rows; deactivated her user`);

  console.log('\n=== Verification ===');
  const staffNow = await prisma.staff.findMany({
    where: { deleted_at: null, status: 'active' },
    include: { schedules: true, user: { select: { email: true } } },
    orderBy: { id: 'asc' },
  });
  for (const s of staffNow) {
    const working = (s.schedules || []).filter((sc) => sc.start_time !== OFF).map((sc) => sc.day_of_week);
    console.log(`  ${s.first_name} ${s.last_name} | ${s.position} | ${s.job_title} | ${working.length} days`);
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