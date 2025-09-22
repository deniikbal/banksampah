import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Student, Class } from '../../types';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface StudentFormProps {
  student: Student | null;
  onClose: () => void;
  onSubmit: () => void;
}

export function StudentForm({ student, onClose, onSubmit }: StudentFormProps) {
  const [formData, setFormData] = useState({
    nis: student?.nis || '',
    name: student?.name || '',
    class: student?.class || ''
  });
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<Class[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Gagal memuat data kelas');
    } finally {
      setClassesLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (student) {
        // Update existing student
        const { error } = await supabase
          .from('students')
          .update(formData)
          .eq('id', student.id);

        if (error) throw error;
        toast.success('Data siswa berhasil diperbarui');
      } else {
        // Create new student
        const { data: newStudent, error: createError } = await supabase
          .from('students')
          .insert(formData)
          .select()
          .single();

        if (createError) throw createError;

        // Create initial savings record
        const { error: savingsError } = await supabase
          .from('savings')
          .insert({
            student_id: newStudent.id,
            balance: 0
          });

        if (savingsError) throw savingsError;
        toast.success('Siswa berhasil ditambahkan');
      }

      onSubmit();
    } catch (error: any) {
      console.error('Error saving student:', error);
      if (error.code === '23505') {
        toast.error('NIS sudah digunakan oleh siswa lain');
      } else {
        toast.error('Gagal menyimpan data siswa');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {student ? 'Edit Siswa' : 'Tambah Siswa'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="nis" className="block text-sm font-medium text-gray-700 mb-1">
              NIS
            </label>
            <input
              type="text"
              id="nis"
              value={formData.nis}
              onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="class" className="block text-sm font-medium text-gray-700 mb-1">
              Kelas
            </label>
            {classesLoading ? (
              <div className="w-full px-3 py-2 text-sm text-gray-500 border border-gray-300 rounded-lg">
                Memuat kelas...
              </div>
            ) : (
              <select
                id="class"
                value={formData.class}
                onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                required
              >
                <option value="">Pilih Kelas</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.name}>
                    {cls.name} - {cls.teacher}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading || classesLoading}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors text-sm"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}