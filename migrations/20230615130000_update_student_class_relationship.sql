-- Migration script to add foreign key relationship between students and classes
-- This script assumes you want to properly link students to classes using a foreign key

-- First, check current data structure
-- SELECT * FROM students LIMIT 5;
-- SELECT * FROM classes LIMIT 5;

-- If students table has a 'class' column that contains class names instead of IDs,
-- we need to update it to use the proper foreign key relationship

-- 1. Add a new class_id column (if it doesn't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'class_id') THEN
        ALTER TABLE students ADD COLUMN class_id UUID REFERENCES classes(id);
    END IF;
END $$;

-- 2. If students.class contains class names, update class_id with proper UUIDs
-- This assumes classes.name matches students.class
UPDATE students 
SET class_id = classes.id
FROM classes 
WHERE students.class = classes.name AND students.class_id IS NULL;

-- 3. If students.class contains class IDs as strings, convert them
-- UPDATE students 
-- SET class_id = classes.id
-- FROM classes 
-- WHERE students.class::UUID = classes.id AND students.class_id IS NULL;

-- 4. Remove the old class column if it's no longer needed
-- ALTER TABLE students DROP COLUMN IF EXISTS class;

-- 5. Rename class_id to class if you want to keep the same column name
-- ALTER TABLE students RENAME COLUMN class_id TO class;

-- 6. Add NOT NULL constraint if all students should have a class
-- ALTER TABLE students ALTER COLUMN class SET NOT NULL;