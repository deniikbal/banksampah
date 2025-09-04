import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Student } from '../../types';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { StudentForm } from './StudentForm';
import toast from 'react-hot-toast';

export function StudentsManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus siswa ini?')) return;

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Siswa berhasil dihapus');
      loadStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Gagal menghapus siswa');
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nis.includes(searchTerm) ||
    student.class.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Siswa</h1>
          <p className="text-gray-600">Kelola data siswa Bank Sampah</p>
        </div>
        <button
          onClick={() => {
            setEditingStudent(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Siswa
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari siswa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">NIS</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">Nama</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">Kelas</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">Bergabung</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredStudents.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{student.nis}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{student.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{student.class}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    {new Date(student.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => {
                          setEditingStudent(student);
                          setShowForm(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Belum ada siswa'}
            </p>
          </div>
        )}
      </div>

      {showForm && (
        <StudentForm
          student={editingStudent}
          onClose={() => {
            setShowForm(false);
            setEditingStudent(null);
          }}
          onSubmit={() => {
            setShowForm(false);
            setEditingStudent(null);
            loadStudents();
          }}
        />
      )}
    </div>
  );
}