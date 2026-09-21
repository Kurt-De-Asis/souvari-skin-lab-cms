-- Membership overdue enforcement (DB-level, runs even when the Node server is down).
-- Idempotent: safe to run multiple times (drops/recreates the event).
--
-- Marks active/partial memberships as "failed" once down_payment_due_date has passed.
-- Requires the MySQL event scheduler to be ON:
--   SET GLOBAL event_scheduler = ON;
-- (Root privilege needed. On managed hosts where this is disabled, the lazy
-- checks in memberships.service.ts processOverdueMemberships() cover the rule.)

SET GLOBAL event_scheduler = ON;

DROP EVENT IF EXISTS `membership_overdue_fail`;
CREATE EVENT `membership_overdue_fail`
  ON SCHEDULE EVERY 1 HOUR
  STARTS CURRENT_TIMESTAMP
  DO
    UPDATE `memberships`
    SET `status` = 'failed',
        `updated_at` = NOW()
    WHERE `status` = 'active'
      AND `payment_status` = 'partial'
      AND `down_payment_due_date` IS NOT NULL
      AND `down_payment_due_date` < CURDATE();