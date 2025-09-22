-- Create the classes table
CREATE TABLE IF NOT EXISTS classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  teacher VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_classes_name ON classes(name);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher);
CREATE INDEX IF NOT EXISTS idx_classes_created_at ON classes(created_at);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_classes_updated_at 
    BEFORE UPDATE ON classes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add some sample data
INSERT INTO classes (name, teacher) VALUES 
  ('X-A', 'Budi Santoso'),
  ('X-B', 'Ani Wijaya'),
  ('XI-A', 'Candra Putra'),
  ('XI-B', 'Dewi Lestari'),
  ('XII-A', 'Eko Prasetyo'),
  ('XII-B', 'Fitri Handayani')
ON CONFLICT (name) DO NOTHING;