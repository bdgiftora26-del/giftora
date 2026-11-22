-- Add UAE Dirham (AED) to the active currency list.
-- 1 AED ≈ 30 BDT (pegged currency) → rateFromBdt = 0.0334
-- Idempotent: safe to run multiple times.
INSERT INTO "Currency" (code, symbol, name, "rateFromBdt", "updatedAt", "isActive")
VALUES ('AED', 'د.إ', 'UAE Dirham', 0.0334, NOW(), true)
ON CONFLICT (code) DO UPDATE
SET symbol = EXCLUDED.symbol,
    name = EXCLUDED.name,
    "rateFromBdt" = EXCLUDED."rateFromBdt",
    "isActive" = true;
