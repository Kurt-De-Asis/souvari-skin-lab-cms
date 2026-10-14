-- Deployment preflight. Runs before `prisma migrate deploy` on every boot.
--
-- Everything here is idempotent and safe to run repeatedly. It exists because
-- the online database is populated by importing a snapshot
-- (deploy/db/souvari-live.sql via deploy/db/apply-live.sh), and a snapshot can
-- carry data that stops the migration chain part-way. When that happens the
-- chatbot silently reads columns that do not exist and reports that it has no
-- information on file. These two statements remove the known blockers.

-- 1. Clear any migration a previous boot left half-applied. Without this,
--    `prisma migrate deploy` aborts with P3009 and never retries it, so every
--    migration after the failed one is skipped forever.
UPDATE _prisma_migrations
SET rolled_back_at = NOW()
WHERE finished_at IS NULL AND rolled_back_at IS NULL;

-- 2. Clear duplicate phone numbers so the unique index added by
--    20261002120000_add_unique_user_phone can be built. The lowest id in each
--    group keeps the number; the rest are set to NULL so the accounts survive
--    and staff can re-collect the numbers. A repeated number in a snapshot
--    otherwise blocks that migration and every migration after it, including
--    20261004120000_add_product_content_fields whose columns the chatbot reads.
--    The join on a derived table keeps MySQL from rejecting the self-reference.
UPDATE users AS u
JOIN (
  SELECT phone AS dup_phone, MIN(id) AS keep_id
  FROM users
  WHERE phone IS NOT NULL AND phone <> ''
  GROUP BY phone
  HAVING COUNT(*) > 1
) AS d ON u.phone = d.dup_phone AND u.id <> d.keep_id
SET u.phone = NULL;
