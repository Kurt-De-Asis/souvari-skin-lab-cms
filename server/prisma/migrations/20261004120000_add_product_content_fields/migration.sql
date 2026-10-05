-- Enriched product content for the clinic assistant. All nullable so existing
-- products are unaffected and a field the clinic has not filled in stays NULL
-- rather than being guessed at.
ALTER TABLE `products` ADD COLUMN `purpose` TEXT NULL;
ALTER TABLE `products` ADD COLUMN `benefits` TEXT NULL;

-- Development-time provenance for researched description/purpose/benefits.
-- Read-only audit data; never consulted at request time.
ALTER TABLE `products` ADD COLUMN `research_sources` JSON NULL;
