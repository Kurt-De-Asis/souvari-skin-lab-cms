-- Deployment preflight (part 1 of 2). Runs before `prisma migrate deploy` on
-- every boot. Everything here is idempotent and safe to run repeatedly.
--
-- The online database is populated by importing a snapshot
-- (deploy/db/souvari-live.sql via deploy/db/apply-live.sh), and a snapshot can
-- carry duplicate phone numbers. Migration 20261002120000_add_unique_user_phone
-- then fails to build its unique index, which aborts the whole chain, so every
-- later migration is skipped -- including 20261004120000_add_product_content_fields
-- whose columns the chatbot reads. When that happens the assistant silently
-- reports that it has no product information on file. This clears the duplicate
-- numbers first so the index can be built.
--
-- The lowest id in each group keeps its number; the duplicates are set to NULL
-- so the accounts survive and staff can re-collect the numbers. Wrapping the
-- self-reference in a derived table keeps both MySQL and MariaDB from rejecting
-- the statement with error 1093.
UPDATE users
SET phone = NULL
WHERE phone IS NOT NULL
  AND phone <> ''
  AND id NOT IN (
    SELECT keep_id FROM (
      SELECT MIN(id) AS keep_id
      FROM users
      WHERE phone IS NOT NULL AND phone <> ''
      GROUP BY phone
    ) AS keepers
  );
