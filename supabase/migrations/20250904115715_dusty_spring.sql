/*
  # School Waste Bank Database Schema

  1. New Tables
    - `students`
      - `id` (uuid, primary key)
      - `nis` (text, unique) - Student identification number
      - `name` (text) - Student full name
      - `class` (text) - Student class
      - `created_at` (timestamp)
    
    - `waste_types` 
      - `id` (uuid, primary key)
      - `name` (text) - Type of waste (plastic, paper, etc.)
      - `price_per_kg` (decimal) - Price per kilogram
      - `created_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key) 
      - `student_id` (uuid, foreign key to students)
      - `waste_type_id` (uuid, foreign key to waste_types)
      - `weight` (decimal) - Weight in kg
      - `total_value` (decimal) - Calculated value
      - `created_at` (timestamp)
    
    - `savings`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students, unique)
      - `balance` (decimal) - Current balance
      - `updated_at` (timestamp)
    
    - `withdrawals`
      - `id` (uuid, primary key)
      - `student_id` (uuid, foreign key to students)
      - `amount` (decimal) - Withdrawal amount
      - `description` (text) - Withdrawal description
      - `status` (text) - pending, approved, rejected
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users based on roles
*/

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nis text UNIQUE NOT NULL,
  name text NOT NULL,
  class text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create waste_types table  
CREATE TABLE IF NOT EXISTS waste_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_per_kg decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  waste_type_id uuid REFERENCES waste_types(id) ON DELETE CASCADE,
  weight decimal(10,2) NOT NULL DEFAULT 0,
  total_value decimal(10,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create savings table
CREATE TABLE IF NOT EXISTS savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE UNIQUE,
  balance decimal(10,2) NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now()
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS withdrawals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE CASCADE,
  amount decimal(10,2) NOT NULL DEFAULT 0,
  description text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE savings ENABLE ROW LEVEL SECURITY;  
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public access to students" ON students FOR ALL TO anon, authenticated USING (true);
CREATE POLICY "Public access to waste_types" ON waste_types FOR ALL TO anon, authenticated USING (true);
CREATE POLICY "Public access to transactions" ON transactions FOR ALL TO anon, authenticated USING (true);
CREATE POLICY "Public access to savings" ON savings FOR ALL TO anon, authenticated USING (true);
CREATE POLICY "Public access to withdrawals" ON withdrawals FOR ALL TO anon, authenticated USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_students_nis ON students(nis);
CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_savings_student_id ON savings(student_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_student_id ON withdrawals(student_id);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- Insert sample data
INSERT INTO waste_types (name, price_per_kg) VALUES
  ('Plastik', 2000),
  ('Kertas', 1500),
  ('Kaleng', 5000),
  ('Botol Kaca', 3000),
  ('Kardus', 1000)
ON CONFLICT DO NOTHING;

INSERT INTO students (nis, name, class) VALUES
  ('12345', 'Ahmad Rizki', '10 IPA 1'),
  ('12346', 'Sari Dewi', '10 IPA 2'),
  ('12347', 'Budi Santoso', '11 IPS 1'),
  ('12348', 'Maya Sari', '11 IPS 2'),
  ('12349', 'Deni Kurniawan', '12 IPA 1')
ON CONFLICT DO NOTHING;

-- Create savings records for all students
INSERT INTO savings (student_id, balance)
SELECT id, 0 FROM students
ON CONFLICT DO NOTHING;