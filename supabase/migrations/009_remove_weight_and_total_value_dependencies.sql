-- Update trigger function to work without weight field
-- This migration removes dependencies on the weight field and total_value field

-- Drop the existing trigger
DROP TRIGGER IF EXISTS calculate_transaction_values ON transactions;

-- Create updated trigger function that works with bottle_count directly
CREATE OR REPLACE FUNCTION calculate_bottle_and_trashbag()
RETURNS TRIGGER AS $$
DECLARE
  waste_type_rec RECORD;
BEGIN
  -- Get waste type information
  SELECT * INTO waste_type_rec FROM waste_types WHERE id = NEW.waste_type_id;

  IF waste_type_rec IS NOT NULL THEN
    -- Ensure bottle_count is set (use provided value or default to 0)
    IF NEW.bottle_count IS NULL THEN
      NEW.bottle_count := 0;
    END IF;

    -- Calculate trashbag reward based on bottle_count
    IF NEW.trashbag_reward IS NULL OR NEW.trashbag_reward = 0 THEN
      NEW.trashbag_reward := FLOOR(NEW.bottle_count / waste_type_rec.trashbags_per_bottle);
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER calculate_transaction_values
    BEFORE INSERT OR UPDATE ON transactions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_bottle_and_trashbag();

-- Remove total_value column if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'transactions' AND column_name = 'total_value') THEN
        ALTER TABLE transactions DROP COLUMN total_value;
    END IF;
END $$;