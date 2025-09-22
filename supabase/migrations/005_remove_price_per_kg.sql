-- Remove price_per_kg column from waste_types table
ALTER TABLE waste_types DROP COLUMN price_per_kg;

-- Update table comment
COMMENT ON TABLE waste_types IS 'Waste types with trashbag reward system';

-- Note: This migration assumes the trashbags_per_bottle column already exists from previous migration