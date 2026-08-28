import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // 1. Merge duplicate Botox Treatment: keep catalog version (#15), copy description, soft-delete legacy (#6)
  const legacyBotox = await prisma.services.findFirst({
    where: { name: 'Botox Treatment', is_legacy: true, deleted_at: null },
  });
  const catalogBotox = await prisma.services.findFirst({
    where: { name: 'Botox Treatment', is_legacy: false, deleted_at: null },
  });
  if (legacyBotox && catalogBotox && legacyBotox.id !== catalogBotox.id) {
    await prisma.services.update({
      where: { id: catalogBotox.id },
      data: { description: legacyBotox.description },
    });
    await prisma.services.update({
      where: { id: legacyBotox.id },
      data: { deleted_at: new Date(), is_active: false, status: 'inactive' },
    });
    console.log('Merged Botox Treatment: kept #' + catalogBotox.id + ', archived legacy #' + legacyBotox.id);
  }

  // 2. Disambiguate Full Face (waxing vs HIFU)
  const hifuFullFace = await prisma.services.findFirst({ where: { slug: 'hifu-full-face', deleted_at: null } });
  if (hifuFullFace && hifuFullFace.name === 'Full Face') {
    await prisma.services.update({ where: { id: hifuFullFace.id }, data: { name: 'Full Face HIFU' } });
    console.log('Renamed HIFU Full Face -> Full Face HIFU');
  }

  // 3. Disambiguate Crystal (nail vs spa add-on)
  const crystalAddon = await prisma.services.findFirst({ where: { slug: 'crystal-addon', deleted_at: null } });
  if (crystalAddon && crystalAddon.name === 'Crystal') {
    await prisma.services.update({ where: { id: crystalAddon.id }, data: { name: 'Crystal (Spa Add-On)' } });
    console.log('Renamed Crystal add-on -> Crystal (Spa Add-On)');
  }

  // 4. Fix zero-duration services so time-slot booking works
  const zeroDur = await prisma.services.findMany({
    where: { deleted_at: null, duration_minutes: 0 },
    select: { id: true, name: true },
  });
  let fixed = 0;
  for (const svc of zeroDur) {
    const duration = /7 session/i.test(svc.name) ? 60 : 15;
    await prisma.services.update({ where: { id: svc.id }, data: { duration_minutes: duration } });
    fixed++;
  }
  console.log('Fixed durations on', fixed, 'services');

  // Verify
  const remainingDupes = await prisma.$queryRaw<any[]>`SELECT name, COUNT(*) as c FROM services WHERE deleted_at IS NULL GROUP BY name HAVING c > 1`;
  const remainingZero = await prisma.services.count({ where: { deleted_at: null, duration_minutes: 0 } });
  const activeCount = await prisma.services.count({ where: { deleted_at: null, is_active: true } });
  console.log('\nRemaining duplicate names:', remainingDupes.length);
  console.log('Remaining zero-duration:', remainingZero);
  console.log('Active bookable services:', activeCount);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
