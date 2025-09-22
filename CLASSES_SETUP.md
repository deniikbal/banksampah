# Setup Kelas (Classes) Functionality

## Langkah-langkah Setup

### 1. Menjalankan Migrasi Database

Untuk membuat tabel `classes` di database Supabase, jalankan migrasi berikut secara berurutan:

#### Migrasi 1: Membuat tabel classes
File: `supabase/migrations/001_create_classes_table.sql`

```sql
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
```

#### Migrasi 2: Menambahkan kolom class ke tabel students (opsional)
File: `supabase/migrations/002_add_class_to_students.sql`

```sql
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
```

#### Migrasi 3: Membuat relasi antara classes dan students (opsional)
File: `supabase/migrations/003_create_classes_with_relationships.sql`

```sql
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

-- Create index on class_id for better performance
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
```

### 2. Menjalankan Migrasi Menggunakan Supabase CLI

Jika Anda memiliki Supabase CLI terinstal, jalankan perintah berikut:

```bash
# Masuk ke direktori proyek
cd /path/to/your/project

# Jalankan migrasi
supabase db push
```

Atau jika Anda ingin menjalankan migrasi satu per satu:

```bash
# Masuk ke dashboard Supabase
# Buka tab SQL Editor
# Salin dan jalankan SQL dari masing-masing file migrasi
```

### 3. Verifikasi Setup

Setelah menjalankan migrasi:

1. Buka aplikasi dan login sebagai admin
2. Navigasi ke menu "Data Kelas"
3. Anda akan melihat daftar kelas yang sudah dibuat
4. Coba tambah, edit, atau hapus kelas untuk memastikan fungsionalitas berjalan dengan baik
5. Buka menu "Data Siswa" dan coba tambah/edit siswa
6. Pastikan dropdown kelas menampilkan data yang benar

### 4. Fitur yang Telah Ditambahkan

1. **CRUD Kelas**: Tambah, lihat, edit, dan hapus data kelas
2. **Validasi Data**: Validasi input untuk memastikan data kelas valid
3. **Pencarian**: Cari kelas berdasarkan nama atau wali kelas
4. **Paginasi**: Navigasi halaman untuk daftar kelas yang panjang
5. **Responsif**: Tampilan yang optimal di desktop dan mobile
6. **Integrasi dengan Siswa**: Dropdown kelas pada form siswa

### 5. Troubleshooting

Jika terjadi masalah:

1. **Error koneksi database**: Pastikan variabel lingkungan Supabase sudah diatur dengan benar
2. **Data tidak muncul**: Periksa apakah migrasi sudah dijalankan dengan sukses
3. **Error validasi**: Pastikan format data sesuai dengan yang diharapkan

Jika ada pertanyaan atau masalah, silakan hubungi tim pengembang.