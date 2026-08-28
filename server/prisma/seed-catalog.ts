import { PrismaClient, Prisma } from '@prisma/client';
import { SectionDef } from './seed-data/types';

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
import eyebrows from './seed-data/catalog/eyebrows';
import permanentMakeup from './seed-data/catalog/permanent-makeup';
import threading from './seed-data/catalog/threading';
import hotWax from './seed-data/catalog/hot-wax';

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
  eyebrows,
  permanentMakeup,
  threading,
  hotWax,
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
  let totalPrices = 0;

  for (const section of allSections) {
    const group = await prisma.service_groups.findUnique({ where: { slug: section.slug } });
    if (!group) throw new Error(`Group not found: ${section.slug}`);

    for (const svc of section.services) {
      const category = (svc.category || 'other') as any;
      const service = await prisma.services.upsert({
        where: { slug: svc.slug },
        update: {
          name: svc.name,
          description: svc.description ?? null,
          category,
          duration_minutes: svc.duration_minutes,
          inclusions: svc.inclusions ?? Prisma.JsonNull,
          needs_verification: svc.needs_verification ?? false,
          group_id: group.id,
          is_active: true,
          status: 'active',
        },
        create: {
          name: svc.name,
          slug: svc.slug,
          description: svc.description ?? null,
          category,
          price: 0,
          duration_minutes: svc.duration_minutes,
          inclusions: svc.inclusions ?? Prisma.JsonNull,
          needs_verification: svc.needs_verification ?? false,
          group_id: group.id,
          is_active: true,
          status: 'active',
        },
      });
      totalServices++;

      // Seed variants
      const variantMap = new Map<number, string>();
      if (svc.variants) {
        for (let i = 0; i < svc.variants.length; i++) {
          const v = svc.variants[i];
          const variant = await prisma.service_variants.upsert({
            where: { service_id_variant_key: { service_id: service.id, variant_key: v.variant_key as any } },
            update: { label: v.label, duration_minutes: v.duration_minutes ?? null, display_order: i },
            create: { service_id: service.id, variant_key: v.variant_key as any, label: v.label, duration_minutes: v.duration_minutes ?? null, display_order: i },
          });
          variantMap.set(i, v.variant_key);
          totalVariants++;
        }
      }

      // Build variant key -> id map
      const existingVariants = await prisma.service_variants.findMany({ where: { service_id: service.id } });
      const variantKeyToId = new Map(existingVariants.map(v => [v.variant_key, v.id]));

      // Seed prices
      for (const priceRow of svc.prices) {
        const variantId = priceRow.variant_key ? variantKeyToId.get(priceRow.variant_key as any) ?? null : null;
        const audience = priceRow.audience as any;
        const staffTier = (priceRow.staff_tier || 'standard') as any;
        const genderScope = (priceRow.gender_scope || 'any') as any;

        // Find existing price row for upsert
        const existing = await prisma.service_prices.findFirst({
          where: {
            service_id: service.id,
            service_variant_id: variantId,
            audience,
            staff_tier: staffTier,
            gender_scope: genderScope,
          },
        });

        if (existing) {
          await prisma.service_prices.update({
            where: { id: existing.id },
            data: {
              amount: priceRow.amount,
              is_available: priceRow.is_available ?? true,
              needs_verification: priceRow.needs_verification ?? false,
              source_ref: priceRow.source_ref ?? null,
            },
          });
        } else {
          await prisma.service_prices.create({
            data: {
              service_id: service.id,
              service_variant_id: variantId,
              audience,
              staff_tier: staffTier,
              gender_scope: genderScope,
              amount: priceRow.amount,
              is_available: priceRow.is_available ?? true,
              needs_verification: priceRow.needs_verification ?? false,
              source_ref: priceRow.source_ref ?? null,
            },
          });
        }
        totalPrices++;
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

  console.log(`  ${totalServices} services, ${totalVariants} variants, ${totalPrices} prices seeded.`);
}

async function generateDataIssues() {
  console.log('Generating data quality issues...');
  let count = 0;

  // Flag all needs_verification services
  const unverifiedServices = await prisma.services.findMany({ where: { needs_verification: true } });
  for (const svc of unverifiedServices) {
    const existing = await prisma.service_data_issues.findFirst({
      where: { service_id: svc.id, issue_type: 'ambiguous_pricing', status: { not: 'resolved' } },
    });
    if (!existing) {
      await prisma.service_data_issues.create({
        data: {
          service_id: svc.id,
          issue_type: 'ambiguous_pricing',
          severity: 'warning',
          status: 'open',
          title: `Ambiguous pricing: ${svc.name}`,
          details: { reason: 'Service flagged as needs verification from PDF source' },
        },
      });
      count++;
    }
  }

  // Flag needs_verification price rows
  const unverifiedPrices = await prisma.service_prices.findMany({ where: { needs_verification: true } });
  for (const price of unverifiedPrices) {
    const existing = await prisma.service_data_issues.findFirst({
      where: { price_id: price.id, issue_type: 'ambiguous_pricing', status: { not: 'resolved' } },
    });
    if (!existing) {
      await prisma.service_data_issues.create({
        data: {
          service_id: price.service_id,
          price_id: price.id,
          issue_type: 'ambiguous_pricing',
          severity: 'warning',
          status: 'open',
          title: `Unverified price row (ID: ${price.id})`,
          details: { amount: price.amount, audience: price.audience, source_ref: price.source_ref },
        },
      });
      count++;
    }
  }

  // Flag wax rows where male is unavailable
  const unavailableMaleWax = await prisma.service_prices.findMany({
    where: { gender_scope: 'male', is_available: false },
  });
  for (const price of unavailableMaleWax) {
    const existing = await prisma.service_data_issues.findFirst({
      where: { price_id: price.id, issue_type: 'unavailable_option', status: { not: 'resolved' } },
    });
    if (!existing) {
      await prisma.service_data_issues.create({
        data: {
          service_id: price.service_id,
          price_id: price.id,
          issue_type: 'unavailable_option',
          severity: 'info',
          status: 'open',
          title: `Male pricing unavailable for service (price ID: ${price.id})`,
          details: { reason: 'PDF shows dash (-) for male non-member price' },
        },
      });
      count++;
    }
  }

  // Flag VIP >= non-member inversions
  const servicesWithPrices = await prisma.services.findMany({
    where: { is_active: true, is_legacy: false },
    include: { prices: { where: { is_available: true } } },
  });
  for (const svc of servicesWithPrices) {
    const vipPrices = svc.prices.filter(p => p.audience === 'vip');
    const nmPrices = svc.prices.filter(p => p.audience === 'non_member');
    for (const vip of vipPrices) {
      const matchingNm = nmPrices.find(nm =>
        nm.service_variant_id === vip.service_variant_id &&
        nm.staff_tier === vip.staff_tier &&
        nm.gender_scope === vip.gender_scope
      );
      if (matchingNm && vip.amount.gte(matchingNm.amount)) {
        const existing = await prisma.service_data_issues.findFirst({
          where: { service_id: svc.id, issue_type: 'pdf_mismatch', status: { not: 'resolved' } },
        });
        if (!existing) {
          await prisma.service_data_issues.create({
            data: {
              service_id: svc.id,
              issue_type: 'pdf_mismatch',
              severity: 'critical',
              status: 'open',
              title: `VIP price >= non-member price: ${svc.name}`,
              details: { vip: vip.amount.toNumber(), non_member: matchingNm.amount.toNumber() },
            },
          });
          count++;
        }
      }
    }
  }

  console.log(`  ${count} data quality issues generated.`);
}

async function main() {
  console.log('=== Catalog Seed ===');
  await seedGroups();
  await seedServices();
  await generateDataIssues();
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
