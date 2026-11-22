-- Add an optional backup phone number to the Delivery record.
-- Lets the customer provide a second contact in case the recipient's
-- primary phone is unreachable at delivery time.
-- Idempotent: safe to run multiple times.
ALTER TABLE "Delivery" ADD COLUMN IF NOT EXISTS "backupPhone" TEXT;
