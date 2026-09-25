import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const NAIL_SPA_PATTERN = /nail|manicure|pedicure|polish|gel|tips|sculptured|cat eye|glazed|ombre|freestyle|poly art|glitter|3d|crystal|extension|hand spa|foot spa|paraffin|whitening \+ para|extra mask|extra scrub|extra massage|french tips|full set|velvet base|hand painted|encapsulated|chrome|lash|brow|microblading|microshading|lip blush|eyeliner|beauty mark|scalp micro|freckle tattoo|areola|scar camo|stretch mark/i;
const CONSULT_PATTERN = /consultation/i;

// Complicated procedures (multi-session packages, HIFU/rejuvenation, injectables)
// are handled ONLY by the clinic nurse (Ms. Queenie Rose Feliciano).
function isComplicatedService(svc: { name: string; category: string; needs_verification: boolean }): boolean {
  if (svc.needs_verification) return true;
  return svc.category === 'package' || svc.category === 'skin_rejuvenation' || svc.category === 'injection';
}

async function main() {
  const staff = await prisma.staff.findMany({
    where: { deleted_at: null },
    select: { id: true, first_name: true, last_name: true, position: true },
  });

  const matches = (position: string, pattern: RegExp) => position && pattern.test(position);
  const role = (pattern: RegExp) => staff.filter((s) => matches(s.position, pattern));

  const aestheticians = role(/facialist|aesthetician|skin\s*_?\s*care/i);
  const therapist = role(/therapist|nail_technician|nail\s*_?\s*tech/i);
  const manager = role(/admin|manager/i);
  const nurse = role(/nurse/i);

  const services = await prisma.services.findMany({
    where: { deleted_at: null, is_active: true },
    select: { id: true, name: true, category: true, needs_verification: true },
  });

  // Clear previous assignments so the new policy is fully applied
  const cleared = await prisma.service_staff.deleteMany();
  if (cleared.count > 0) {
    console.log(`Cleared ${cleared.count} previous assignments`);
  }

  const data: { service_id: number; staff_id: number }[] = [];
  const seen = new Set<string>();

  for (const svc of services) {
    let assignees: number[] = [];

    if (isComplicatedService(svc)) {
      assignees = nurse.map((s) => s.id);
    } else if (CONSULT_PATTERN.test(svc.name)) {
      assignees = manager.map((s) => s.id);
    } else if (NAIL_SPA_PATTERN.test(svc.name)) {
      assignees = [...therapist.map((s) => s.id), ...aestheticians.slice(0, 2).map((s) => s.id)];
    } else {
      assignees = [...aestheticians.map((s) => s.id), ...manager.map((s) => s.id)];
    }

    for (const staffId of assignees) {
      const key = `${svc.id}-${staffId}`;
      if (!seen.has(key)) {
        seen.add(key);
        data.push({ service_id: svc.id, staff_id: staffId });
      }
    }
  }

  const result = await prisma.service_staff.createMany({ data });
  console.log(`Created ${result.count} service_staff assignments`);

  const total = await prisma.service_staff.count();
  console.log(`Total assignments now: ${total}`);

  const nurseCount = data.filter((d) => d.staff_id === nurse[0]?.id).length;
  console.log(`Complicated services assigned to nurse only: ${nurseCount}`);

  const orphanServices = await prisma.services.count({
    where: { deleted_at: null, is_active: true, service_staff: { none: {} } },
  });
  console.log(`Active services with NO staff: ${orphanServices}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());