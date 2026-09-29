-- CreateTable
CREATE TABLE `service_reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `customer_id` INTEGER NOT NULL,
    `appointment_id` INTEGER NOT NULL,
    `service_id` INTEGER NOT NULL,
    `staff_id` INTEGER NULL,
    `rating` INTEGER NOT NULL,
    `feedback` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `service_reviews_appointment_id_key`(`appointment_id`),
    INDEX `service_reviews_service_id_idx`(`service_id`),
    INDEX `service_reviews_customer_id_idx`(`customer_id`),
    INDEX `service_reviews_staff_id_idx`(`staff_id`),
    INDEX `service_reviews_rating_idx`(`rating`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `service_reviews` ADD CONSTRAINT `service_reviews_customer_id_fkey` FOREIGN KEY (`customer_id`) REFERENCES `customers`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_reviews` ADD CONSTRAINT `service_reviews_appointment_id_fkey` FOREIGN KEY (`appointment_id`) REFERENCES `appointments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_reviews` ADD CONSTRAINT `service_reviews_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `service_reviews` ADD CONSTRAINT `service_reviews_staff_id_fkey` FOREIGN KEY (`staff_id`) REFERENCES `staff`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
