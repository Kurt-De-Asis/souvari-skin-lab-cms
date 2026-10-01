import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Services created from the admin panel only ever get a `category_id`, never a
 * `group_id`. The public booking page groups services by `service_groups`, so
 * those services land in a phantom group of their own and a second section
 * appears under the category's name. Both tables are seeded 1:1 from the same
 * catalog sections, so the category name resolves the missing group.
 */
async function main() {
  const orphans = await prisma.services.findMany({
    where: { group_id: null, category_id: { not: null } },
    select: { id: true, name: true, category_ref: { select: { id: true, name: true } } },
    orderBy: { id: 'asc' },
  });

  if (orphans.length === 0) {
    console.log('No services are missing a group. Nothing to do.');
    return;
  }

  let fixed = 0;
  const skipped: string[] = [];

  for (const svc of orphans) {
    const category = svc.category_ref;
    if (!category) {
      skipped.push(`#${svc.id} ${svc.name} (no category)`);
      continue;
    }

    const group = await prisma.service_groups.findFirst({
      where: { name: category.name },
      select: { id: true, slug: true },
    });

    if (!group) {
      skipped.push(`#${svc.id} ${svc.name} (category: ${category.name})`);
      continue;
    }

    await prisma.services.update({ where: { id: svc.id }, data: { group_id: group.id } });
    fixed++;
    console.log(`#${svc.id} ${svc.name} -> group "${group.slug}" (${category.name})`);
  }

  console.log(`\nFixed ${fixed} service(s).`);
  if (skipped.length > 0) {
    console.log(`Skipped ${skipped.length} — no service_groups row matches the category name:`);
    for (const line of skipped) console.log(`  ${line}`);
  }

  const remaining = await prisma.services.count({ where: { group_id: null, category_id: { not: null } } });
  console.log(`Remaining without a group: ${remaining}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());