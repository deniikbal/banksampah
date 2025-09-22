-- Add trashbags_per_bottle column to waste_types table
ALTER TABLE waste_types
ADD COLUMN trashbags_per_bottle INTEGER NOT NULL DEFAULT 20;

-- Add comment for clarity
COMMENT ON COLUMN waste_types.trashbags_per_bottle IS 'Number of bottles needed to get 1 trashbag reward';

-- Update existing waste types with default values
UPDATE waste_types SET trashbags_per_bottle = 20 WHERE trashbags_per_bottle IS NULL;