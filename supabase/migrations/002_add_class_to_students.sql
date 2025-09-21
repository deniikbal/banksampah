-- Add class column to students table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'students' AND column_name = 'class'
  ) THEN
    ALTER TABLE students ADD COLUMN class VARCHAR(100);
  END IF;
END $$;

-- Create index on class column for better performance
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class);