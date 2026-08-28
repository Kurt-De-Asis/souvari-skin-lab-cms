import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Employee Migration Script ===\n');

  // ── Step 1: Remove existing employee data safely ──
  console.log('Step 1: Cleaning up existing employee data...');

  // Get all staff IDs (except we'll handle admin separately)
  const allStaff = await prisma.staff.findMany({
    select: { id: true, user_id: true },
  });
  const staffIds = allStaff.map(s => s.id);
  const staffUserIds = allStaff.map(s => s.user_id);

  console.log(`  Found ${staffIds.length} staff members to remove`);

  // Delete in FK-safe order
  // 1. transaction_items (references transactions)
  const deletedTxItems = await prisma.transaction_items.deleteMany({
    where: { transaction: { staff_id: { in: staffIds } } },
  });
  console.log(`  Deleted ${deletedTxItems.count} transaction_items`);

  // 2. transactions (SET NULL on staff_id, but clean up fully)
  const deletedTx = await prisma.transactions.deleteMany({
    where: { staff_id: { in: staffIds } },
  });
  console.log(`  Deleted ${deletedTx.count} transactions`);

  // 3. treatment_records (RESTRICT on staff_id)
  const deletedTreatments = await prisma.treatment_records.deleteMany({
    where: { staff_id: { in: staffIds } },
  });
  console.log(`  Deleted ${deletedTreatments.count} treatment_records`);

  // 4. appointments (RESTRICT on staff_id)
  const deletedAppts = await prisma.appointments.deleteMany({
    where: { staff_id: { in: staffIds } },
  });
  console.log(`  Deleted ${deletedAppts.count} appointments`);

  // 5. service_staff (CASCADE, but explicit)
  const deletedSvcStaff = await prisma.service_staff.deleteMany({
    where: { staff_id: { in: staffIds } },
  });
  console.log(`  Deleted ${deletedSvcStaff.count} service_staff assignments`);

  // 6. staff_schedules (CASCADE, but explicit)
  const deletedSchedules = await prisma.staff_schedules.deleteMany({
    where: { staff_id: { in: staffIds } },
  });
  console.log(`  Deleted ${deletedSchedules.count} staff_schedules`);

  // 7. Delete staff records
  const deletedStaff = await prisma.staff.deleteMany({
    where: { id: { in: staffIds } },
  });
  console.log(`  Deleted ${deletedStaff.count} staff records`);

  // 8. Delete staff user accounts (keep admin)
  const deletedUsers = await prisma.users.deleteMany({
    where: { id: { in: staffUserIds }, role: 'staff' },
  });
  console.log(`  Deleted ${deletedUsers.count} user accounts`);

  // Also clean up any orphaned notifications for deleted users
  const deletedNotifs = await prisma.notifications.deleteMany({
    where: { user_id: { in: staffUserIds } },
  });
  console.log(`  Deleted ${deletedNotifs.count} notifications`);

  console.log('\n✓ Employee data cleaned up\n');

  // ── Step 2: Add 7 new team members ──
  console.log('Step 2: Creating new team members...');

  const passwordHash = await bcrypt.hash('password123', 12);

  // Helper to create staff member with user account and schedules
  async function createStaffMember(config: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
    jobTitle?: string;
    permissionLevel: string;
    rating?: number;
    role: 'staff' | 'admin';
    schedule: Array<{ day: string; start: string; end: string }>;
  }) {
    // Create user account
    const user = await prisma.users.create({
      data: {
        email: config.email,
        password_hash: passwordHash,
        role: config.role as any,
        status: 'active',
        phone: config.phone,
      },
    });

    // Create staff profile
    const staff = await prisma.staff.create({
      data: {
        user_id: user.id,
        first_name: config.firstName,
        last_name: config.lastName,
        position: config.position as any,
        job_title: config.jobTitle ?? null,
        permission_level: config.permissionLevel,
        rating: config.rating ?? null,
        status: 'active',
      },
    });

    // Create schedules
    const dayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6,
    };

    for (const sched of config.schedule) {
      await prisma.staff_schedules.create({
        data: {
          staff_id: staff.id,
          day_of_week: sched.day as any,
          start_time: sched.start,
          end_time: sched.end,
          is_active: true,
        },
      });
    }

    console.log(`  ✓ Created ${config.firstName} ${config.lastName} (${config.email})`);
    return { user, staff };
  }

  // 1. Gian Heart Daygon
  await createStaffMember({
    firstName: 'Gian Heart',
    lastName: 'Daygon',
    email: 'gianheartdaygon24@gmail.com',
    phone: '+63199631651',
    position: 'aesthetician',
    permissionLevel: 'medium',
    role: 'staff',
    schedule: [
      { day: 'sunday', start: '11:00', end: '20:00' },
      { day: 'monday', start: '00:00', end: '00:00' }, // off
      { day: 'tuesday', start: '11:00', end: '20:00' },
      { day: 'wednesday', start: '11:00', end: '20:00' },
      { day: 'thursday', start: '11:00', end: '20:00' },
      { day: 'friday', start: '11:00', end: '20:00' },
      { day: 'saturday', start: '11:00', end: '20:00' },
    ],
  });

  // 2. Princess Ashly Diuna
  await createStaffMember({
    firstName: 'Princess Ashly',
    lastName: 'Diuna',
    email: 'princessdiuna3@gmail.com',
    phone: '+639959582764',
    position: 'aesthetician',
    permissionLevel: 'medium',
    rating: 5.0,
    role: 'staff',
    schedule: [
      { day: 'sunday', start: '00:00', end: '00:00' }, // off
      { day: 'monday', start: '00:00', end: '00:00' }, // off
      { day: 'tuesday', start: '00:00', end: '00:00' }, // off
      { day: 'wednesday', start: '11:00', end: '20:00' },
      { day: 'thursday', start: '11:00', end: '20:00' },
      { day: 'friday', start: '11:00', end: '20:00' },
      { day: 'saturday', start: '00:00', end: '00:00' }, // off
    ],
  });

  // 3. Jocelyn Corpuz
  await createStaffMember({
    firstName: 'Jocelyn',
    lastName: 'Corpuz',
    email: 'jocelyncorpuz11582@gmail.com',
    phone: '+639704888151',
    position: 'aesthetician',
    jobTitle: 'Skincare Specialist',
    permissionLevel: 'medium',
    role: 'staff',
    schedule: [
      { day: 'sunday', start: '10:00', end: '20:00' },
      { day: 'monday', start: '10:00', end: '20:00' },
      { day: 'tuesday', start: '10:00', end: '20:00' },
      { day: 'wednesday', start: '10:00', end: '20:00' },
      { day: 'thursday', start: '00:00', end: '00:00' }, // off
      { day: 'friday', start: '10:00', end: '20:00' },
      { day: 'saturday', start: '10:00', end: '20:00' },
    ],
  });

  // 4. Jobelle Cabanig
  await createStaffMember({
    firstName: 'Jobelle',
    lastName: 'Cabanig',
    email: 'lumayajobelle@gmail.com',
    phone: '+639541547410',
    position: 'aesthetician',
    jobTitle: 'Skincare Specialist',
    permissionLevel: 'medium',
    rating: 5.0,
    role: 'staff',
    schedule: [
      { day: 'sunday', start: '10:00', end: '20:00' },
      { day: 'monday', start: '10:00', end: '20:00' },
      { day: 'tuesday', start: '10:00', end: '20:00' },
      { day: 'wednesday', start: '00:00', end: '00:00' }, // off
      { day: 'thursday', start: '10:00', end: '20:00' },
      { day: 'friday', start: '10:00', end: '20:00' },
      { day: 'saturday', start: '10:00', end: '20:00' },
    ],
  });

  // 5. Rica May Coronel
  await createStaffMember({
    firstName: 'Rica May',
    lastName: 'Coronel',
    email: 'coronelcassandria@gmail.com',
    phone: '+639676630207',
    position: 'therapist',
    jobTitle: 'Nail Technician',
    permissionLevel: 'medium',
    rating: 5.0,
    role: 'staff',
    schedule: [
      { day: 'sunday', start: '10:00', end: '20:00' },
      { day: 'monday', start: '10:00', end: '20:00' },
      { day: 'tuesday', start: '10:00', end: '20:00' },
      { day: 'wednesday', start: '00:00', end: '00:00' }, // off
      { day: 'thursday', start: '10:00', end: '20:00' },
      { day: 'friday', start: '10:00', end: '20:00' },
      { day: 'saturday', start: '10:00', end: '20:00' },
    ],
  });

  // 6. Souvari Skin Lab (update existing admin)
  console.log('\n  Updating admin account to Souvari Skin Lab...');
  const adminUser = await prisma.users.findFirst({
    where: { role: 'admin' },
  });

  if (adminUser) {
    // Update admin user
    await prisma.users.update({
      where: { id: adminUser.id },
      data: {
        email: 'souvariskinlab@gmail.com',
        phone: '+639816899909',
      },
    });

    // Create or update staff profile for admin
    const existingAdminStaff = await prisma.staff.findUnique({
      where: { user_id: adminUser.id },
    });

    if (existingAdminStaff) {
      await prisma.staff.update({
        where: { id: existingAdminStaff.id },
        data: {
          first_name: 'Souvari',
          last_name: 'Skin Lab',
          position: 'manager',
          job_title: 'Workspace Owner',
          permission_level: 'owner',
          status: 'active',
        },
      });

      // Add schedules for admin (Mon-Sat 10:00-20:00, Sun off)
      const adminDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      for (const day of adminDays) {
        await prisma.staff_schedules.upsert({
          where: { staff_id_day_of_week: { staff_id: existingAdminStaff.id, day_of_week: day as any } },
          update: { start_time: '10:00', end_time: '20:00', is_active: true },
          create: { staff_id: existingAdminStaff.id, day_of_week: day as any, start_time: '10:00', end_time: '20:00', is_active: true },
        });
      }
      // Sunday off
      await prisma.staff_schedules.upsert({
        where: { staff_id_day_of_week: { staff_id: existingAdminStaff.id, day_of_week: 'sunday' } },
        update: { start_time: '00:00', end_time: '00:00', is_active: true },
        create: { staff_id: existingAdminStaff.id, day_of_week: 'sunday', start_time: '00:00', end_time: '00:00', is_active: true },
      });

      console.log('  ✓ Updated admin → Souvari Skin Lab (manager, owner)');
    } else {
      // Create staff profile for admin
      const adminStaff = await prisma.staff.create({
        data: {
          user_id: adminUser.id,
          first_name: 'Souvari',
          last_name: 'Skin Lab',
          position: 'manager',
          job_title: 'Workspace Owner',
          permission_level: 'owner',
          status: 'active',
        },
      });

      const adminDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      for (const day of adminDays) {
        await prisma.staff_schedules.create({
          data: { staff_id: adminStaff.id, day_of_week: day as any, start_time: '10:00', end_time: '20:00', is_active: true },
        });
      }
      await prisma.staff_schedules.create({
        data: { staff_id: adminStaff.id, day_of_week: 'sunday', start_time: '00:00', end_time: '00:00', is_active: true },
      });

      console.log('  ✓ Created staff profile for admin → Souvari Skin Lab');
    }
  } else {
    console.log('  ⚠ No admin user found — creating new admin account');
    const user = await prisma.users.create({
      data: {
        email: 'souvariskinlab@gmail.com',
        password_hash: passwordHash,
        role: 'admin',
        status: 'active',
        phone: '+639816899909',
      },
    });
    const staff = await prisma.staff.create({
      data: {
        user_id: user.id,
        first_name: 'Souvari',
        last_name: 'Skin Lab',
        position: 'manager',
        job_title: 'Workspace Owner',
        permission_level: 'owner',
        status: 'active',
      },
    });
    const adminDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    for (const day of adminDays) {
      await prisma.staff_schedules.create({
        data: { staff_id: staff.id, day_of_week: day as any, start_time: '10:00', end_time: '20:00', is_active: true },
      });
    }
    await prisma.staff_schedules.create({
      data: { staff_id: staff.id, day_of_week: 'sunday', start_time: '00:00', end_time: '00:00', is_active: true },
    });
    console.log('  ✓ Created Souvari Skin Lab admin account');
  }

  // 7. Wendy Jane Puti-an
  await createStaffMember({
    firstName: 'Wendy Jane',
    lastName: 'Puti-an',
    email: 'wendyjaneputian@gmail.com',
    phone: '+639173851616',
    position: 'aesthetician',
    permissionLevel: 'medium',
    rating: 5.0,
    role: 'staff',
    schedule: [
      { day: 'sunday', start: '10:00', end: '20:00' },
      { day: 'monday', start: '10:00', end: '20:00' },
      { day: 'tuesday', start: '10:00', end: '20:00' },
      { day: 'wednesday', start: '10:00', end: '20:00' },
      { day: 'thursday', start: '00:00', end: '00:00' }, // off
      { day: 'friday', start: '10:00', end: '20:00' },
      { day: 'saturday', start: '10:00', end: '20:00' },
    ],
  });

  // ── Step 3: Verify ──
  console.log('\n=== Verification ===');

  const staffCount = await prisma.staff.count({ where: { deleted_at: null } });
  console.log(`Total staff in database: ${staffCount}`);

  const allStaffNow = await prisma.staff.findMany({
    include: { user: { select: { email: true, role: true } } },
    orderBy: { last_name: 'asc' },
  });

  for (const s of allStaffNow) {
    const schedules = await prisma.staff_schedules.findMany({
      where: { staff_id: s.id, is_active: true },
      orderBy: { day_of_week: 'asc' },
    });
    const workingDays = schedules.filter(sc => sc.start_time !== '00:00' || sc.end_time !== '00:00');
    console.log(`  ${s.first_name} ${s.last_name} | ${s.user.email} | ${s.user.role} | ${s.position} | ${s.permission_level} | ${s.rating ?? 'N/A'} | ${workingDays.length} days/week`);
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
