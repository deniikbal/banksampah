-- Add updated_at column to transactions table
ALTER TABLE transactions
ADD COLUMN updated_at timestamptz DEFAULT now();

-- Add comment for clarity
COMMENT ON COLUMN transactions.updated_at IS 'Last update timestamp';

-- Update existing records to have updated_at set to created_at
UPDATE transactions SET updated_at = created_at WHERE updated_at IS NULL;