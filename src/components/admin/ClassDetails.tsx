import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Student } from '../../types';
import { X, Search, Plus, Edit, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ClassDetailsProps {
  classId: string;
  className: string;
  onClose: () => void;
  onStudentAdded: () => void;
}

export function ClassDetails({ classId, className, onClose, onStudentAdded }: ClassDetailsProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddStudentForm, setShowAddStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  useEffect(() => {
    loadStudents();
  }, [classId]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class', classId)
        .order('name', { ascending: true });

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error loading students:', error);
      toast.error('Gagal memuat data siswa');
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.nis.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="flex justify-between items-center border-b border-gray-200 p-4">
          <h2 className="text-lg font-bold text-gray-900">
            Siswa di Kelas {className}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between gap-3">
            <div className="relative max-w-md flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari siswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowAddStudentForm(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors self-start sm:self-auto whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              Tambah Siswa
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-grow">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">
                {searchTerm ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Belum ada siswa di kelas ini'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">NIS</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">Nama</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-gray-900">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm font-medium text-gray-900">{student.nis}</td>
                      <td className="py-3 px-4 text-sm text-gray-900">{student.name}</td>
                      <td className="py-3 px-4">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => {
                              setEditingStudent(student);
                              setShowAddStudentForm(true);
                            }}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={async () => {
                              if (!confirm('Yakin ingin menghapus siswa ini?')) return;
                              
                              try {
                                const { error } = await supabase
                                  .from('students')
                                  .delete()
                                  .eq('id', student.id);
                                
                                if (error) throw error;
                                
                                toast.success('Siswa berhasil dihapus');
                                loadStudents();
                              } catch (error) {
                                console.error('Error deleting student:', error);
                                toast.error('Gagal menghapus siswa');
                              }
                            }}
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
          )}
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              Menampilkan {filteredStudents.length} dari {students.length} siswa
            </p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {showAddStudentForm && (
        <StudentForm
          classId={classId}
          studentData={editingStudent}
          onClose={() => {
            setShowAddStudentForm(false);
            setEditingStudent(null);
          }}
          onSubmit={() => {
            setShowAddStudentForm(false);
            setEditingStudent(null);
            loadStudents();
            onStudentAdded();
          }}
        />
      )}
    </div>
  );
}

interface StudentFormProps {
  classId: string;
  studentData: Student | null;
  onClose: () => void;
  onSubmit: () => void;
}

function StudentForm({ classId, studentData, onClose, onSubmit }: StudentFormProps) {
  const [formData, setFormData] = useState({
    nis: studentData?.nis || '',
    name: studentData?.name || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (studentData) {
        // Update existing student
        const { error } = await supabase
          .from('students')
          .update({
            nis: formData.nis,
            name: formData.name,
            class: classId
          })
          .eq('id', studentData.id);

        if (error) throw error;
        toast.success('Data siswa berhasil diperbarui');
      } else {
        // Create new student
          const { error } = await supabase
            .from('students')
            .insert({
              nis: formData.nis,
              name: formData.name,
              class: classId
            });

        if (error) throw error;
        toast.success('Siswa berhasil ditambahkan');
      }

      onSubmit();
      onClose();
    } catch (error: any) {
      console.error('Error saving student:', error);
      toast.error(error.message || 'Gagal menyimpan data siswa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center border-b border-gray-200 p-4">
          <h2 className="text-lg font-bold text-gray-900">
            {studentData ? 'Edit Siswa' : 'Tambah Siswa'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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
              placeholder="Nomor Induk Siswa"
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
              placeholder="Nama lengkap siswa"
              required
            />
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
              disabled={loading}
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