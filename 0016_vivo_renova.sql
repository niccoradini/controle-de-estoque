ALTER TABLE withdrawal_requests ADD COLUMN renova_enabled INTEGER NOT NULL DEFAULT 0;
ALTER TABLE withdrawal_requests ADD COLUMN renova_used_device TEXT;
ALTER TABLE withdrawal_requests ADD COLUMN renova_condition TEXT;
ALTER TABLE withdrawal_requests ADD COLUMN renova_voucher_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE withdrawal_requests ADD COLUMN renova_manufacturer_bonus_cents INTEGER NOT NULL DEFAULT 0;
ALTER TABLE withdrawal_requests ADD COLUMN renova_discount_cents INTEGER NOT NULL DEFAULT 0;

