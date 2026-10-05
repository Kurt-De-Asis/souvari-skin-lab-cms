import { PrismaClient, Prisma } from '@prisma/client';
import {
  mergeResearchedContent,
  type ContentMergeResult,
  type ProductContentFields,
} from '../../src/modules/products/products.content';
import {
  PRODUCT_CONTENT,
  PRODUCT_CONTENT_RESEARCHED_AT,
  type ResearchedProductContentEntry,
} from '../data/product-content';

/**
 * Fill description/purpose/benefits on retail products from the researched
 * dataset in `prisma/data/product-content.ts`.
 *
 * Safety properties:
 * - Fill-only. `mergeResearchedContent` never overwrites a field the clinic has
 *   already filled in, so re-running is idempotent and manual edits are safe.
 * - SKU + name guarded. An entry only applies when the product still exists and
 *   its name matches the name recorded at research time, so a reused SKU can
 *   never silently receive the wrong content.
 * - Dry-run by default. Nothing is written unless `--apply` is passed.
 *
 * Usage:
 *   npx ts-node --project tsconfig.seed.json prisma/scripts/enrich-product-content.ts
 *   npx ts-node --project tsconfig.seed.json prisma/scripts/enrich-product-content.ts --apply
 *   npx ts-node --project tsconfig.seed.json prisma/scripts/enrich-product-content.ts --apply --allow-missing
 */

const prisma = new PrismaClient();

const argv = new Set(process.argv.slice(2));
const APPLY = argv.has('--apply');
const ALLOW_MISSING = argv.has('--allow-missing');

interface PlannedWrite {
  id: number;
  sku: string;
  name: string;
  merge: ContentMergeResult;
  researchSources: Prisma.InputJsonValue;
}

interface Report {
  planned: PlannedWrite[];
  preserved: Array<{ sku: string; name: string; fields: string[] }>;
  notFound: string[];
  nameMismatch: Array<{ sku: string; expected: string; actual: string }>;
}

async function plan(): Promise<Report> {
  const report: Report = { planned: [], preserved: [], notFound: [], nameMismatch: [] };
  const skus = PRODUCT_CONTENT.map((e) => e.sku);

  const rows = await prisma.products.findMany({
    where: { sku: { in: skus }, deleted_at: null },
    select: {
      id: true,
      sku: true,
      name: true,
      description: true,
      purpose: true,
      benefits: true,
    },
  });
  const bySku = new Map(rows.map((r) => [r.sku, r]));

  for (const entry of PRODUCT_CONTENT) {
    const row = bySku.get(entry.sku);
    if (!row) {
      report.notFound.push(entry.sku);
      continue;
    }
    if (row.name !== entry.expectedName) {
      report.nameMismatch.push({ sku: entry.sku, expected: entry.expectedName, actual: row.name });
      continue;
    }

    const existing: ProductContentFields = {
      description: row.description,
      purpose: row.purpose,
      benefits: row.benefits,
    };
    const merge = mergeResearchedContent(existing, entry.content);

    if (merge.filled.length === 0) {
      report.preserved.push({ sku: entry.sku, name: row.name, fields: merge.preserved });
      continue;
    }

    report.planned.push({
      id: row.id,
      sku: entry.sku,
      name: row.name,
      merge,
      researchSources: buildResearchSources(entry),
    });
  }

  return report;
}

function buildResearchSources(entry: ResearchedProductContentEntry): Prisma.InputJsonValue {
  return {
    confidence: entry.confidence,
    researchedAt: PRODUCT_CONTENT_RESEARCHED_AT,
    sources: entry.sources,
  } as unknown as Prisma.InputJsonValue;
}

function describe(merge: ContentMergeResult): string {
  const parts: string[] = [];
  if (merge.filled.length > 0) parts.push(`fill ${merge.filled.join(', ')}`);
  if (merge.preserved.length > 0) parts.push(`keep ${merge.preserved.join(', ')}`);
  return parts.join(' | ');
}

async function main() {
  console.log('=== Product content enrichment ===');
  console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY RUN (pass --apply to write)'}`);
  console.log(`Entries: ${PRODUCT_CONTENT.length}\n`);

  const report = await plan();

  for (const w of report.planned) {
    console.log(`  [${APPLY ? 'WRITE' : 'PLAN '}] ${w.sku} ${w.name} -> ${describe(w.merge)}`);
  }
  for (const p of report.preserved) {
    console.log(`  [KEEP ] ${p.sku} ${p.name} -> already has ${p.fields.join(', ')}`);
  }
  for (const sku of report.notFound) {
    console.warn(`  [MISS ] ${sku} -> no active product with this SKU`);
  }
  for (const m of report.nameMismatch) {
    console.warn(`  [DRIFT] ${m.sku} -> expected "${m.expected}" but found "${m.actual}" (skipped)`);
  }

  let written = 0;
  if (APPLY && report.planned.length > 0) {
    await prisma.$transaction(
      report.planned.map((w) =>
        prisma.products.update({
          where: { id: w.id },
          data: {
            ...w.merge.updates,
            research_sources: w.researchSources,
          },
        }),
      ),
    );
    written = report.planned.length;
  }

  console.log('\n---');
  console.log(`Matched & up-to-date: ${report.preserved.length}`);
  console.log(`${APPLY ? 'Written' : 'Would write'}: ${report.planned.length}`);
  console.log(`Missing SKU: ${report.notFound.length}`);
  console.log(`Name mismatch (skipped): ${report.nameMismatch.length}`);
  if (APPLY) console.log(`Rows updated: ${written}`);

  const drift = report.notFound.length + report.nameMismatch.length;
  if (drift > 0 && !ALLOW_MISSING) {
    console.error(
      `\nFAIL: ${drift} entry(ies) did not match the database. Re-run with --allow-missing to ignore.`,
    );
    process.exitCode = 1;
  } else if (!APPLY) {
    console.log('\nDry run complete. No changes were written.');
  }
}

main()
  .catch((e) => {
    console.error('Enrichment failed:', e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
