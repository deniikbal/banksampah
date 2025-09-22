-- Create table for trashbag withdrawals
CREATE TABLE IF NOT EXISTS trashbag_withdrawals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trashbag_withdrawals_student_id ON trashbag_withdrawals(student_id);
CREATE INDEX IF NOT EXISTS idx_trashbag_withdrawals_status ON trashbag_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_trashbag_withdrawals_created_at ON trashbag_withdrawals(created_at);

-- Add updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS handle_trashbag_withdrawals_updated_at ON trashbag_withdrawals;
CREATE TRIGGER handle_trashbag_withdrawals_updated_at
    BEFORE UPDATE ON trashbag_withdrawals
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Add RLS (Row Level Security) - Using public access similar to other tables
ALTER TABLE trashbag_withdrawals ENABLE ROW LEVEL SECURITY;

-- Create public access policy similar to students table
CREATE POLICY "Public access to trashbag_withdrawals" ON trashbag_withdrawals
    FOR ALL TO anon, authenticated USING (true);