-- Drop the temporary migration files and create the proper classes table
DROP TABLE IF EXISTS classes;

-- Create the classes table with proper constraints
CREATE TABLE classes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  teacher VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_classes_name ON classes(name);
CREATE INDEX idx_classes_teacher ON classes(teacher);
CREATE INDEX idx_classes_created_at ON classes(created_at);

-- Create a trigger to automatically update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at 
    BEFORE UPDATE ON classes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add sample data
INSERT INTO classes (name, teacher) VALUES 
  ('X-A', 'Budi Santoso'),
  ('X-B', 'Ani Wijaya'),
  ('XI-A', 'Candra Putra'),
  ('XI-B', 'Dewi Lestari'),
  ('XII-A', 'Eko Prasetyo'),
  ('XII-B', 'Fitri Handayani')
ON CONFLICT (name) DO NOTHING;

-- Add foreign key constraint to students table
-- First, we need to clean up any existing class data that doesn't match our classes
-- Then add the foreign key constraint
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id);

-- Update existing students with class_id based on their class name
UPDATE students 
SET class_id = classes.id
FROM classes
WHERE students.class = classes.name;

-- Drop the old class column
-- ALTER TABLE students DROP COLUMN IF EXISTS class;

-- Create index on class_id for better performance
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);