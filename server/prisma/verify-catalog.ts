import { PrismaClient } from '@prisma/client';
import { SectionDef } from './seed-data/types';

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

const EXPECTED_SECTIONS: SectionDef[] = [
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

const VALID_CATEGORIES = new Set([
  'facial',
  'body',
  'hair_removal',
  'skin_rejuvenation',
  'injection',
  'laser',
  'consultation',
  'package',
  'signature_facial',
  'other',
]);

type Expected = {
  slug: string;
  name: string;
  price: number;
  category: string;
  groupSlug: string;
  groupName: string;
};

function collect(): { expected: Expected[]; sizes: Record<string, number>; total: number } {
  const expected: Expected[] = [];
  const sizes: Record<string, number> = {};
  for (const section of EXPECTED_SECTIONS) {
    sizes[section.name] = section.services.length;
    for (const svc of section.services) {
      expected.push({
        slug: svc.slug,
        name: svc.name,
        price: svc.prices.find((p) => p.audience === 'non_member')?.amount ?? svc.prices[0]?.amount ?? 0,
        category: svc.category,
        groupSlug: section.slug,
        groupName: section.name,
      });
    }
  }
  return { expected, sizes, total: expected.length };
}

const money = (n: number | string): number => Math.round(Number(n) * 100) / 100;

async function main() {
  const { expected, sizes, total } = collect();
  let failures = 0;

  console.log('=== Catalog Verify ===');
  console.log(`Expected: ${EXPECTED_SECTIONS.length} sections, ${total} services.`);
  console.log('Section sizes:');
  for (const [name, count] of Object.entries(sizes)) {
    console.log(`  ${name}: ${count}`);
  }

  // Sanity: duplicate slugs / bad prices / bad categories (names may repeat across sections)
  const seenSlug = new Map<string, string>();
  for (const e of expected) {
    if (seenSlug.has(e.slug)) {
      console.error(`  [DATA] Duplicate slug "${e.slug}" (${e.name} vs ${seenSlug.get(e.slug)})`);
      failures++;
    }
    seenSlug.set(e.slug, e.name);
    if (!e.price || e.price <= 0) {
      console.error(`  [DATA] Non-positive price for "${e.name}" (${e.price})`);
      failures++;
    }
    if (!VALID_CATEGORIES.has(e.category)) {
      console.error(`  [DATA] Invalid category "${e.category}" for "${e.name}"`);
      failures++;
    }
  }

  // Groups must exist with matching name
  const groups = await prisma.service_groups.findMany();
  const groupBySlug = new Map(groups.map((g) => [g.slug, g]));
  for (const section of EXPECTED_SECTIONS) {
    const g = groupBySlug.get(section.slug);
    if (!g) {
      console.error(`  [GROUP] Missing group "${section.slug}" (${section.name})`);
      failures++;
    } else if (g.name !== section.name) {
      console.error(`  [GROUP] Group "${section.slug}" name mismatch: DB="${g.name}" expected="${section.name}"`);
      failures++;
    }
  }

  // Compare against active DB catalog
  const active = await prisma.services.findMany({
    where: { is_active: true, status: 'active' },
    select: { id: true, slug: true, name: true, price: true, category: true, group_id: true },
  });

  const expectedBySlug = new Map(expected.map((e) => [e.slug, e]));
  const matchedSlugs = new Set<string>();

  for (const svc of active) {
    const exp = svc.slug ? expectedBySlug.get(svc.slug) : undefined;
    if (!exp && !svc.slug) {
      console.error(`  [EXTRA] Active service without slug: id=${svc.id} "${svc.name}"`);
      failures++;
      continue;
    }
    if (!exp) {
      const group = svc.group_id ? groupBySlug.get(groups.find((g) => g.id === svc.group_id)?.slug ?? '') : undefined;
      console.error(`  [EXTRA] Active service not in catalog: "${svc.name}"${group ? ` (group=${group.name})` : ''} price=${money(Number(svc.price))}`);
      failures++;
      continue;
    }
    matchedSlugs.add(exp.slug);
    const svcPrice = Number(svc.price);
    if (money(svcPrice) !== money(exp.price)) {
      console.error(`  [PRICE] "${svc.name}": DB=${money(svcPrice)} expected=${money(exp.price)}`);
      failures++;
    }
    if (svc.category !== exp.category) {
      console.error(`  [CATEGORY] "${svc.name}": DB=${svc.category} expected=${exp.category}`);
      failures++;
    }
    const group = svc.group_id ? groups.find((g) => g.id === svc.group_id) : undefined;
    if (group && group.slug !== exp.groupSlug) {
      console.error(`  [GROUP] "${svc.name}": DB group="${group.slug}" expected="${exp.groupSlug}"`);
      failures++;
    }
  }

  for (const e of expected) {
    if (!matchedSlugs.has(e.slug)) {
      console.error(`  [MISSING] "${e.name}" (${e.groupName}) price=${e.price} not active in DB`);
      failures++;
    }
  }

  console.log('---');
  if (failures === 0) {
    console.log(`PASS: active catalog matches seed (${total} services across ${EXPECTED_SECTIONS.length} sections).`);
    process.exit(0);
  } else {
    console.error(`FAIL: ${failures} issue(s) found.`);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('Verification failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });