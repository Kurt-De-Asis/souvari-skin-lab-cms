-- Manual staff discount applied at booking time.
-- Nullable so every existing appointment is unaffected; a NULL means no
-- manual discount was granted.
ALTER TABLE `appointments` ADD COLUMN `discount_pct` DECIMAL(5,2) NULL;
ALTER TABLE `appointments` ADD COLUMN `discount_reason` VARCHAR(255) NULL;
