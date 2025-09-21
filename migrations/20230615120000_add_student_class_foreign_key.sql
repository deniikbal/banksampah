-- Migration script to add foreign key relationship between students and classes

-- First, let's check if the class column exists and what data it contains
SELECT DISTINCT class FROM students WHERE class IS NOT NULL LIMIT 10;

-- If the class column contains class names instead of IDs, we need to:
-- 1. Add a new class_id column
-- 2. Populate it with the correct class IDs based on class names
-- 3. Drop the old class column
-- 4. Rename the new column to class
-- 5. Add the foreign key constraint

-- Step 1: Add a new class_id column
ALTER TABLE students ADD COLUMN class_id UUID REFERENCES classes(id);

-- Step 2: Update the class_id based on matching class names with class names in the classes table
-- This assumes that the current 'class' column in students contains class names that match the 'name' column in classes
UPDATE students 
SET class_id = classes.id
FROM classes 
WHERE students.class = classes.name;

-- Step 3: Drop the old class column
ALTER TABLE students DROP COLUMN class;

-- Step 4: Rename class_id to class
ALTER TABLE students RENAME COLUMN class_id TO class;

-- Step 5: Add NOT NULL constraint if needed
-- ALTER TABLE students ALTER COLUMN class SET NOT NULL;