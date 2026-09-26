import { PrismaClient, Prisma } from '@prisma/client';
import { SectionDef, CatalogServiceInput } from './seed-data/types';

import signatureFacials from './seed-data/catalog/signature-facials';
import bodyWhitening from './seed-data/catalog/body-whitening';
import diodeLaser from './seed-data/catalog/diode-laser';
import ultratightHifu from './seed-data/catalog/hifu';
import radioFrequency from './seed-data/catalog/rf';
import ultratight3 from './seed-data/catalog/ultratight-3';
import rf7 from './seed-data/catalog/rf-7';
import bodyWhitening7 from './seed-data/catalog/bw-7';
import diode7 from './seed-data/catalog/diode-7';
import nailsEssential from './seed-data/catalog/nails-essential';
import nailsGel from './seed-data/catalog/nails-gel';
import nailsExtensions from './seed-data/catalog/nails-extensions';
import footHandSpa from './seed-data/catalog/foot-hand-spa';
import lashesBrows from './seed-data/catalog/lashes-brows';
import permanentMakeup from './seed-data/catalog/permanent-makeup';
import threading from './seed-data/catalog/threading';
import hotWax from './seed-data/catalog/hot-wax';
import doctorsProcedures from './seed-data/catalog/doctors-procedures';

const prisma = new PrismaClient();

const allSections: SectionDef[] = [
  signatureFacials,
  bodyWhitening,
  diodeLaser,
  ultratightHifu,
  radioFrequency,
  ultratight3,
  rf7,
  bodyWhitening7,
  diode7,
  nailsEssential,
  nailsGel,
  nailsExtensions,
  footHandSpa,
  lashesBrows,
  permanentMakeup,
  threading,
  hotWax,
  doctorsProcedures,
];

async function seedGroups() {
  console.log('Seeding service groups...');
  for (const section of allSections) {
    await prisma.service_groups.upsert({
      where: { slug: section.slug },
      update: { name: section.name, description: section.description ?? null, display_order: section.display_order, is_bookable: section.is_bookable ?? true },
      create: { slug: section.slug, name: section.name, description: section.description ?? null, display_order: section.display_order, is_bookable: section.is_bookable ?? true },
    });
  }
  console.log(`  ${allSections.length} groups seeded.`);
}

async function seedCategories() {
  console.log('Seeding service categories (README headings)...');
  let totalCategories = 0;
  for (const section of allSections) {
    await prisma.service_categories.upsert({
      where: { name: section.name },
      update: { description: section.description ?? null, sort_order: section.display_order, is_active: true },
      create: { name: section.name, description: section.description ?? null, sort_order: section.display_order, is_active: true },
    });
    totalCategories++;
  }
  console.log(`  ${totalCategories} categories seeded.`);
}

async function seedServices() {
  console.log('Seeding services...');
  let totalServices = 0;
  let totalVariants = 0;

  for (const section of allSections) {
    const group = await prisma.service_groups.findUnique({ where: { slug: section.slug } });
    if (!group) throw new Error(`Group not found: ${section.slug}`);

    const category = await prisma.service_categories.findUnique({ where: { name: section.name } });
    if (!category) throw new Error(`Category not found: ${section.name}`);

    for (const svc of section.services) {
      const category = (svc.category || 'other') as any;
      const legacy = getLegacyPrices(svc);
      const service = await prisma.services.upsert({
        where: { slug: svc.slug },
        update: {
          name: svc.name,
          description: svc.description ?? null,
          category,
          category_id: category.id,
          service_type: 'Individual',
          price: legacy.base,
          vip_price: legacy.vip,
          non_member_price: legacy.nm,
          duration_minutes: svc.duration_minutes,
          inclusions: svc.inclusions ?? Prisma.JsonNull,
          needs_verification: svc.needs_verification ?? false,
          external_id: svc.external_id ?? null,
          sku: svc.sku ?? null,
          treatment_type: svc.treatment_type ?? null,
          online_booking: svc.online_booking ?? 'Enabled',
          available_for: svc.available_for ?? 'Everyone',
          voucher_sales: svc.voucher_sales ?? 'Enabled',
          commissions: svc.commissions ?? 'Enabled',
          group_id: group.id,
          is_active: true,
          status: 'active',
        },
        create: {
          name: svc.name,
          slug: svc.slug,
          description: svc.description ?? null,
          category,
          category_id: category.id,
          service_type: 'Individual',
          price: legacy.base,
          vip_price: legacy.vip,
          non_member_price: legacy.nm,
          duration_minutes: svc.duration_minutes,
          inclusions: svc.inclusions ?? Prisma.JsonNull,
          needs_verification: svc.needs_verification ?? false,
external_id: svc.external_id ?? null,
          sku: svc.sku ?? null,
          treatment_type: svc.treatment_type ?? null,
          online_booking: svc.online_booking ?? 'Enabled',
          available_for: svc.available_for ?? 'Everyone',
          voucher_sales: svc.voucher_sales ?? 'Enabled',
          commissions: svc.commissions ?? 'Enabled',
          group_id: group.id,
          is_active: true,
          status: 'active',
        },
      });
      totalServices++;

      // Seed variants
      if (svc.variants) {
        for (let i = 0; i < svc.variants.length; i++) {
          const v = svc.variants[i];
          await prisma.service_variants.upsert({
            where: { service_id_variant_key: { service_id: service.id, variant_key: v.variant_key as any } },
            update: { label: v.label, duration_minutes: v.duration_minutes ?? null, display_order: i },
            create: { service_id: service.id, variant_key: v.variant_key as any, label: v.label, duration_minutes: v.duration_minutes ?? null, display_order: i },
          });
          totalVariants++;
        }
      }

      // Seed package if present
      if (svc.package) {
        await prisma.service_packages.upsert({
          where: { service_id: service.id },
          update: {
            sessions_included: svc.package.sessions_included,
            session_price: svc.package.session_price,
            ten_session_price: svc.package.ten_session_price ?? null,
            inclusions: svc.package.inclusions ?? Prisma.JsonNull,
            savings_note: svc.package.savings_note ?? null,
          },
          create: {
            service_id: service.id,
            sessions_included: svc.package.sessions_included,
            session_price: svc.package.session_price,
            ten_session_price: svc.package.ten_session_price ?? null,
            inclusions: svc.package.inclusions ?? Prisma.JsonNull,
            savings_note: svc.package.savings_note ?? null,
          },
        });
      }
    }
  }

  console.log(`  ${totalServices} services, ${totalVariants} variants seeded.`);
}

async function retireOrphanedServices() {
  console.log('Retiring orphaned services (slug not in current catalog, incl. legacy)...');
  const currentSlugs = new Set(allSections.flatMap(s => s.services.map(svc => svc.slug)));

  const orphaned = await prisma.services.findMany({
    where: {
      is_active: true,
      OR: [{ group_id: { not: null } }, { is_legacy: true }],
    },
  });

  let retired = 0;
  for (const svc of orphaned) {
    if (!svc.slug || !currentSlugs.has(svc.slug)) {
      await prisma.services.update({
        where: { id: svc.id },
        data: { is_active: false, status: 'inactive' },
      });
      retired++;
    }
  }
  console.log(`  ${retired} orphaned services retired.`);
}

async function retireOrphanedGroups() {
  console.log('Sinking orphaned service groups (not in current catalog)...');
  const currentGroupSlugs = new Set(allSections.map((s) => s.slug));
  const groups = await prisma.service_groups.findMany();

  let sunk = 0;
  for (const group of groups) {
    if (!currentGroupSlugs.has(group.slug)) {
      await prisma.service_groups.update({
        where: { id: group.id },
        data: { display_order: 999, is_bookable: false },
      });
      sunk++;
    }
  }
  console.log(`  ${sunk} orphaned groups sunk to bottom & hidden.`);
}

async function retireOrphanedCategories() {
  console.log('Retiring orphaned service categories (not in current catalog)...');
  const currentNames = new Set(allSections.map((s) => s.name));
  const categories = await prisma.service_categories.findMany();

  let retired = 0;
  for (const cat of categories) {
    if (!currentNames.has(cat.name)) {
      await prisma.service_categories.update({
        where: { id: cat.id },
        data: { is_active: false },
      });
      retired++;
    }
  }
  console.log(`  ${retired} orphaned categories hidden.`);
}

function getLegacyPrices(svc: CatalogServiceInput) {
  const isBase = (p: (typeof svc.prices)[number]) =>
    !p.variant_key &&
    (!p.staff_tier || p.staff_tier === 'standard') &&
    (!p.gender_scope || p.gender_scope === 'any');

  const vip = svc.prices.find((p) => isBase(p) && p.audience === 'vip')?.amount ?? null;
  const nm = svc.prices.find((p) => isBase(p) && p.audience === 'non_member')?.amount ?? null;
  const regular = svc.prices.find((p) => isBase(p) && p.audience === 'regular')?.amount ?? null;
  const base = nm ?? regular ?? svc.prices[0]?.amount ?? 0;

  return { base, vip, nm };
}

async function main() {
  console.log('=== Catalog Seed ===');
  await seedGroups();
  await seedCategories();
  await seedServices();
  await retireOrphanedServices();
  await retireOrphanedGroups();
  await retireOrphanedCategories();
  console.log('=== Catalog Seed Complete ===');
}

main()
  .catch((e) => {
    console.error('Catalog seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
