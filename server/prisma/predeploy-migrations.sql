-- Deployment preflight (part 2 of 2). Runs before `prisma migrate deploy` on
-- every boot.
--
-- A previous boot can leave a migration half-applied (its row in
-- _prisma_migrations has finished_at NULL, usually because the statement failed
-- part-way). `prisma migrate deploy` then refuses to run anything at all with
-- P3009 until that row is resolved. Marking it rolled back lets the next
-- `migrate deploy` retry it, so a failed unique-phone index does not permanently
-- block every migration behind it.
--
-- This is a no-op when there is nothing half-applied, and safely errors (and is
-- ignored by the container start command) on a brand-new database that has no
-- _prisma_migrations table yet.
UPDATE _prisma_migrations
SET rolled_back_at = NOW()
WHERE finished_at IS NULL AND rolled_back_at IS NULL;
