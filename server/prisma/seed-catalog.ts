import { PrismaClient, Prisma } from '@prisma/client';
import { SectionDef, CatalogServiceInput } from './seed-data/types';

import signatureFacials from './seed-data/catalog/signature-facials';
import glowCombos from './seed-data/catalog/glow-combos';
import bodyWhitening from './seed-data/catalog/body-whitening';
import diodeLaser from './seed-data/catalog/diode-laser';
import beautyEnhancers from './seed-data/catalog/beauty-enhancers';
import hifu from './seed-data/catalog/hifu';
import sessionPackages from './seed-data/catalog/session-packages';
import skinTagRemoval from './seed-data/catalog/skin-tag-removal';
import nailsEssential from './seed-data/catalog/nails-essential';
import nailsGel from './seed-data/catalog/nails-gel';
import nailsExtensions from './seed-data/catalog/nails-extensions';
import nailsArt from './seed-data/catalog/nails-art';
import nailsCrystals from './seed-data/catalog/nails-crystals';
import nailsPackages from './seed-data/catalog/nails-packages';
import handSpa from './seed-data/catalog/hand-spa';
import footSpa from './seed-data/catalog/foot-spa';
import spaAddons from './seed-data/catalog/spa-addons';
import lashesBrows from './seed-data/catalog/lashes-brows';
import permanentMakeup from './seed-data/catalog/permanent-makeup';
import threading from './seed-data/catalog/threading';
import hotWax from './seed-data/catalog/hot-wax';
import advanceAestheticSolutions from './seed-data/catalog/advance-aesthetic-solutions';
import premiumIvDrips from './seed-data/catalog/premium-iv-drips';
import premiumIvAddons from './seed-data/catalog/premium-iv-addons';

const prisma = new PrismaClient();

const allSections: SectionDef[] = [
  signatureFacials,
  glowCombos,
  bodyWhitening,
  diodeLaser,
  beautyEnhancers,
  hifu,
  sessionPackages,
  skinTagRemoval,
  nailsEssential,
  nailsGel,
  nailsExtensions,
  nailsArt,
  nailsCrystals,
  nailsPackages,
  handSpa,
  footSpa,
  spaAddons,
  lashesBrows,
  permanentMakeup,
  threading,
  hotWax,
  advanceAestheticSolutions,
  premiumIvDrips,
  premiumIvAddons,
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

async function seedServices() {
  console.log('Seeding services...');
  let totalServices = 0;
  let totalVariants = 0;

  for (const section of allSections) {
    const group = await prisma.service_groups.findUnique({ where: { slug: section.slug } });
    if (!group) throw new Error(`Group not found: ${section.slug}`);

    for (const svc of section.services) {
      const category = (svc.category || 'other') as any;
      const legacy = getLegacyPrices(svc);
      const service = await prisma.services.upsert({
        where: { slug: svc.slug },
        update: {
          name: svc.name,
          description: svc.description ?? null,
          category,
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
  console.log('Retiring orphaned group services (slug not in current catalog)...');
  const currentSlugs = new Set(allSections.flatMap(s => s.services.map(svc => svc.slug)));

  const orphaned = await prisma.services.findMany({
    where: {
      is_active: true,
      is_legacy: false,
      group_id: { not: null },
    },
  });

  let retired = 0;
  for (const svc of orphaned) {
    if (svc.slug && !currentSlugs.has(svc.slug)) {
      await prisma.services.update({
        where: { id: svc.id },
        data: { is_active: false, status: 'inactive' },
      });
      retired++;
    }
  }
  console.log(`  ${retired} orphaned services retired.`);
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
  await seedServices();
  await retireOrphanedServices();
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
