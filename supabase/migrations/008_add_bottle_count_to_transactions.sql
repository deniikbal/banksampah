-- Add bottle_count and trashbag_reward columns to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS bottle_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS trashbag_reward INTEGER DEFAULT 0;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_bottle_count ON transactions(bottle_count);
CREATE INDEX IF NOT EXISTS idx_transactions_trashbag_reward ON transactions(trashbag_reward);

-- Add check constraints using DO block to handle existing constraints
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_bottle_count_positive') THEN
        ALTER TABLE transactions ADD CONSTRAINT chk_bottle_count_positive CHECK (bottle_count >= 0);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_trashbag_reward_positive') THEN
        ALTER TABLE transactions ADD CONSTRAINT chk_trashbag_reward_positive CHECK (trashbag_reward >= 0);
    END IF;
END $$;

-- Update existing transactions to calculate bottle_count and trashbag_reward
-- This is a one-time migration for existing data
UPDATE transactions
SET
  bottle_count = CASE
    WHEN waste_type_id IS NOT NULL AND weight > 0 THEN
      CASE
        WHEN (SELECT name FROM waste_types WHERE id = transactions.waste_type_id) = 'Plastik' THEN ROUND(weight / 0.05)
        WHEN (SELECT name FROM waste_types WHERE id = transactions.waste_type_id) = 'Kertas' THEN ROUND(weight / 0.02)
        WHEN (SELECT name FROM waste_types WHERE id = transactions.waste_type_id) = 'Kaleng' THEN ROUND(weight / 0.1)
        WHEN (SELECT name FROM waste_types WHERE id = transactions.waste_type_id) = 'Botol Kaca' THEN ROUND(weight / 0.3)
        WHEN (SELECT name FROM waste_types WHERE id = transactions.waste_type_id) = 'Kardus' THEN ROUND(weight / 0.05)
        ELSE ROUND(weight / 0.05) -- default
      END
    ELSE 0
  END,
  trashbag_reward = CASE
    WHEN waste_type_id IS NOT NULL AND weight > 0 THEN
      FLOOR(
        CASE
          WHEN (SELECT name FROM waste_types WHERE id = transactions.waste_type_id) = 'Plastik' THEN ROUND(weight / 0.05)
          WHEN (SELECT name FROM waste_types WHERE id = transactions.waste_type_id) = 'Kertas' THEN ROUND(weight / 0.02)
          WHEN (SELECT name FROM waste_types WHERE id = transactions.waste_type_id) = 'Kaleng' THEN ROUND(weight / 0.1)
          WHEN (SELECT name FROM waste_types WHERE id = transactions.waste_type_id) = 'Botol Kaca' THEN ROUND(weight / 0.3)
          WHEN (SELECT name FROM waste_types WHERE id = transactions.waste_type_id) = 'Kardus' THEN ROUND(weight / 0.05)
          ELSE ROUND(weight / 0.05) -- default
        END / (SELECT trashbags_per_bottle FROM waste_types WHERE id = transactions.waste_type_id)
      )
    ELSE 0
  END
WHERE
  bottle_count = 0 OR trashbag_reward = 0;

-- Create trigger function for automatic calculation
CREATE OR REPLACE FUNCTION calculate_bottle_and_trashbag()
RETURNS TRIGGER AS $$
DECLARE
  waste_type_rec RECORD;
  bottle_weight DECIMAL;
BEGIN
  -- Get waste type information
  SELECT * INTO waste_type_rec FROM waste_types WHERE id = NEW.waste_type_id;

  IF waste_type_rec IS NOT NULL THEN
    -- Calculate bottle weight based on waste type name
    CASE waste_type_rec.name
      WHEN 'Plastik' THEN bottle_weight := 0.05;
      WHEN 'Kertas' THEN bottle_weight := 0.02;
      WHEN 'Kaleng' THEN bottle_weight := 0.1;
      WHEN 'Botol Kaca' THEN bottle_weight := 0.3;
      WHEN 'Kardus' THEN bottle_weight := 0.05;
      ELSE bottle_weight := 0.05; -- default
    END CASE;

    -- Calculate bottle count from weight if bottle_count is not provided
    IF NEW.bottle_count IS NULL OR NEW.bottle_count = 0 THEN
      NEW.bottle_count := ROUND(NEW.weight / bottle_weight);
    END IF;

    -- Calculate trashbag reward
    IF NEW.trashbag_reward IS NULL OR NEW.trashbag_reward = 0 THEN
      NEW.trashbag_reward := FLOOR(NEW.bottle_count / waste_type_rec.trashbags_per_bottle);
    END IF;

    -- Set total_value to 0 for trashbag reward system
    NEW.total_value := 0;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic calculation on insert and update
DROP TRIGGER IF EXISTS calculate_transaction_values ON transactions;
CREATE TRIGGER calculate_transaction_values
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_bottle_and_trashbag();

-- Add comments for documentation
COMMENT ON COLUMN transactions.bottle_count IS 'Jumlah botol asli yang dikumpulkan siswa';
COMMENT ON COLUMN transactions.trashbag_reward IS 'Jumlah trashbag reward yang didapatkan dari transaksi ini';