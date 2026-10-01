import { PrismaClient } from '@prisma/client';
import { toE164 } from '../src/utils/phone';

const prisma = new PrismaClient();

/**
 * Normalises every `users.phone` to E.164 and clears duplicates so a unique
 * index can be applied to the column.
 *
 * Two things make this necessary rather than optional:
 *
 * 1. Existing rows are a mix of formats — most are already `+63917…`, but a few
 *    are still local (`09171234567`, `09918690956`). A unique index compares the
 *    stored bytes, so without normalisation the same person could hold
 *    `09171234567` and `+639171234567` and still pass the constraint.
 *
 * 2. Normalisation makes previously-distinct rows collide. `0999999999` and
 *    `09999999999` both resolve to `+639999999999`, so the index cannot be
 *    created until the clash is resolved.
 *
 * The lowest user id in each group keeps the number; the rest are set to NULL
 * so the accounts survive and staff can re-collect the number. Nothing is
 * deleted. Dry-run by default — pass `--apply` to write.
 */
const APPLY = process.argv.includes('--apply');

function normalize(raw: string): string {
  // `toE164` treats "+"-prefixed input as already international and returns it
  // unchanged, so running it is safe even for malformed legacy values like
  // +63999999999. Re-running the script is therefore idempotent.
  return toE164(raw) ?? raw.trim();
}

async function main() {
  const users = await prisma.users.findMany({
    where: { phone: { not: null } },
    select: { id: true, email: true, role: true, phone: true, deleted_at: true },
    orderBy: { id: 'asc' },
  });

  const rows = users.filter((u) => u.phone && u.phone.trim().length > 0);

  // Group by the normalised value, not the stored one.
  const groups = new Map<string, typeof rows>();
  for (const u of rows) {
    const key = normalize(u.phone!);
    const bucket = groups.get(key);
    if (bucket) bucket.push(u);
    else groups.set(key, [u]);
  }

  const renames: { user: (typeof rows)[number]; from: string; to: string }[] = [];
  const collisions: Record<string, typeof rows> = {};
  for (const [key, bucket] of groups) {
    const first = bucket[0];
    for (const u of bucket) {
      if (u.phone !== key) renames.push({ user: u, from: u.phone!, to: key });
    }
    if (bucket.length > 1) collisions[key] = bucket;
  }

  console.log(`Users with a phone: ${rows.length}`);
  console.log(`Values needing E.164 normalisation: ${renames.length}`);
  for (const r of renames) {
    // A well-formed PH mobile is "+63" + 10 digits starting with 9. Anything
    // else was already bad input; normalising makes it consistently unique but
    // the number itself is not a usable contact.
    const subscriber = r.to.replace(/^\+/, '').replace(/^63/, '');
    const suspect = !/^9\d{9}$/.test(subscriber) ? '  <-- malformed, not a valid PH mobile' : '';
    console.log(`  #${r.user.id} ${r.user.role.padEnd(8)} ${r.from} -> ${r.to}${suspect}`);
  }

  const collisionKeys = Object.keys(collisions);
  console.log(`\nDuplicate numbers after normalisation: ${collisionKeys.length} group(s)`);
  for (const key of collisionKeys) {
    console.log(`  ${key}`);
    for (const u of collisions[key]) {
      const role = u.role.padEnd(8);
      const state = u.deleted_at ? 'soft-deleted' : 'active';
      const disposition = u.id === collisions[key][0].id ? 'KEEPS' : 'would be cleared';
      console.log(`    #${u.id} ${role} ${state.padEnd(12)} ${u.email} — ${disposition}`);
    }
  }

  const toClear = collisionKeys.flatMap((key) =>
    collisions[key].slice(1).map((u) => ({ id: u.id, email: u.email, key })),
  );

  if (!APPLY) {
    console.log('\nDry run — no changes written. Re-run with --apply to write.');
    return;
  }

  let cleared = 0;
  for (const item of toClear) {
    await prisma.users.update({ where: { id: item.id }, data: { phone: null } });
    cleared++;
    console.log(`Cleared phone on #${item.id} (${item.email}) — duplicate of ${item.key}`);
  }

  console.log(`\nCleared ${cleared} duplicate phone value(s).`);

  // Renames are skipped for any row we just cleared.
  const clearedIds = new Set(toClear.map((c) => c.id));
  let normalized = 0;
  for (const r of renames) {
    if (clearedIds.has(r.user.id)) continue;
    await prisma.users.update({ where: { id: r.user.id }, data: { phone: r.to } });
    normalized++;
  }
  console.log(`Normalised ${normalized} phone value(s) to E.164.`);

  const verify = await prisma.$queryRaw<{ phone: string; c: number }[]>`
    SELECT phone, COUNT(*) as c FROM users
    WHERE phone IS NOT NULL AND phone <> ''
    GROUP BY phone HAVING c > 1
  `;
  console.log(`\nRemaining duplicate groups: ${verify.length}`);
  for (const row of verify) console.log(`  ${row.phone} x${row.c}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
