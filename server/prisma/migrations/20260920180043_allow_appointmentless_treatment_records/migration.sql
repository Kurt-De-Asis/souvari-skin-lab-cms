-- Allow clinical notes and allergy alerts to be recorded without a linked
-- appointment/service (used by the customer detail drawer from the calendar).
ALTER TABLE `treatment_records` MODIFY `appointment_id` INTEGER NULL;
ALTER TABLE `treatment_records` MODIFY `staff_id` INTEGER NULL;
ALTER TABLE `treatment_records` MODIFY `service_id` INTEGER NULL;