-- DropForeignKey
ALTER TABLE `customers` DROP FOREIGN KEY `customers_preferred_staff_id_fkey`;

-- DropIndex
DROP INDEX `customers_preferred_staff_id_fkey` ON `customers`;

-- DropColumn
ALTER TABLE `customers` DROP COLUMN `preferred_staff_id`;
