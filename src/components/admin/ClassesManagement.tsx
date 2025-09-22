import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Class } from '../../types';
import { Plus, Edit, Trash2, Search, X, Upload, Download, CheckSquare, Square } from 'lucide-react';
import toast from 'react-hot-toast';
import { ClassDetails } from './ClassDetails';
import { ImportClasses } from './ImportClasses';
import * as XLSX from 'xlsx';

interface ClassFormProps {
  classData: Class | null;
  onClose: () => void;
  onSubmit: () => void;
}

function ClassForm({ classData, onClose, onSubmit }: ClassFormProps) {
  const [formData, setFormData] = useState({
    name: classData?.name || '',
    teacher: classData?.teacher || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (classData) {
        // Update existing class
        const { error } = await supabase
          .from('classes')
          .update({
            name: formData.name,
            teacher: formData.teacher,
            updated_at: new Date().toISOString()
          })
          .eq('id', classData.id);

        if (error) throw error;
        toast.success('Kelas berhasil diperbarui');
      } else {
        // Create new class
        const { error } = await supabase
          .from('classes')
          .insert({
            name: formData.name,
            teacher: formData.teacher
          });

        if (error) throw error;
        toast.success('Kelas berhasil ditambahkan');
      }

      onSubmit();
      onClose();
    } catch (error) {
      console.error('Error saving class:', error);
      toast.error('Gagal menyimpan kelas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center border-b border-gray-200 p-4">
          <h2 className="text-lg font-bold text-gray-900">
            {classData ? 'Edit Kelas' : 'Tambah Kelas'}
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Kelas
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Contoh: X-A, XI-B"
              required
            />
          </div>

          <div>
            <label htmlFor="teacher" className="block text-sm font-medium text-gray-700 mb-1">
              Wali Kelas
            </label>
            <input
              type="text"
              id="teacher"
              value={formData.teacher}
              onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="Nama wali kelas"
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

export function ClassesManagement() {
  const [classes, setClasses] = useState<(Class & { studentCount: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedClass, setSelectedClass] = useState<(Class & { studentCount: number }) | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [classToDelete, setClassToDelete] = useState<Class & { studentCount: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [classesPerPage, setClassesPerPage] = useState(5);
  const [selectedClasses, setSelectedClasses] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      // First, get all classes
      const { data: classesData, error: classesError } = await supabase
        .from('classes')
        .select('*')
        .order('created_at', { ascending: false });

      if (classesError) throw classesError;

      // Then, get student count for each class
      const classesWithCount = await Promise.all(
        classesData.map(async (classItem) => {
          const { count, error } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class', classItem.id);

          if (error) {
            console.error('Error fetching student count for class:', classItem.id, error);
            return { ...classItem, studentCount: 0 };
          }

          return { ...classItem, studentCount: count || 0 };
        })
      );

      setClasses(classesWithCount);
    } catch (error) {
      console.error('Error loading classes:', error);
      toast.error('Gagal memuat data kelas');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const classItem = classes.find(c => c.id === id);
    if (classItem) {
      setClassToDelete(classItem);
      setShowDeleteConfirm(true);
    }
  };

  const confirmDelete = async () => {
    if (!classToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', classToDelete.id);

      if (error) throw error;

      toast.success('Kelas berhasil dihapus');
      setShowDeleteConfirm(false);
      setClassToDelete(null);
      loadClasses();
    } catch (error) {
      console.error('Error deleting class:', error);
      toast.error('Gagal menghapus kelas');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setClassToDelete(null);
  };

  const filteredClasses = classes.filter(cls =>
    cls.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cls.teacher.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredClasses.length / classesPerPage);
  const startIndex = (currentPage - 1) * classesPerPage;
  const paginatedClasses = filteredClasses.slice(startIndex, startIndex + classesPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of table when changing pages
    const tableElement = document.querySelector('.bg-white.rounded-xl.shadow-sm');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleClassesPerPageChange = (value: number) => {
    setClassesPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleSelectClass = (classId: string) => {
    const newSelected = new Set(selectedClasses);
    if (newSelected.has(classId)) {
      newSelected.delete(classId);
    } else {
      newSelected.add(classId);
    }
    setSelectedClasses(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedClasses.size === paginatedClasses.length) {
      setSelectedClasses(new Set());
    } else {
      const allIds = paginatedClasses.map(c => c.id);
      setSelectedClasses(new Set(allIds));
    }
  };

  const handleBulkDelete = () => {
    if (selectedClasses.size === 0) {
      toast.error('Pilih kelas yang ingin dihapus');
      return;
    }
    setShowBulkDeleteConfirm(true);
  };

  const confirmBulkDelete = async () => {
    setBulkDeleting(true);
    try {
      const { error } = await supabase
        .from('classes')
        .delete()
        .in('id', Array.from(selectedClasses));

      if (error) throw error;

      toast.success(`Berhasil menghapus ${selectedClasses.size} kelas`);
      setShowBulkDeleteConfirm(false);
      setSelectedClasses(new Set());
      loadClasses();
    } catch (error) {
      console.error('Error bulk deleting classes:', error);
      toast.error('Gagal menghapus kelas');
    } finally {
      setBulkDeleting(false);
    }
  };

  const cancelBulkDelete = () => {
    setShowBulkDeleteConfirm(false);
  };

  const downloadTemplate = () => {
    // Create template data
    const templateData = [
      {
        'Nama Kelas': 'VII-A',
        'Wali Kelas': 'Ahmad Suryadi, S.Pd.',
        'Keterangan': 'Kelas contoh - ganti dengan data asli'
      },
      {
        'Nama Kelas': 'VII-B',
        'Wali Kelas': 'Dewi Lestari, S.Pd.',
        'Keterangan': 'Kelas contoh - ganti dengan data asli'
      },
      {
        'Nama Kelas': 'VIII-A',
        'Wali Kelas': 'Budi Santoso, S.Pd.',
        'Keterangan': 'Kelas contoh - ganti dengan data asli'
      },
      {
        'Nama Kelas': 'VIII-B',
        'Wali Kelas': 'Siti Nurhaliza, S.Pd.',
        'Keterangan': 'Kelas contoh - ganti dengan data asli'
      },
      {
        'Nama Kelas': 'IX-A',
        'Wali Kelas': 'Agus Wijaya, S.Pd.',
        'Keterangan': 'Kelas contoh - ganti dengan data asli'
      }
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(templateData);

    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // Nama Kelas
      { wch: 25 }, // Wali Kelas
      { wch: 35 }  // Keterangan
    ];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Template Kelas');

    // Create instructions worksheet
    const instructionsData = [
      ['PETUNJUK PENGISIAN TEMPLATE KELAS'],
      [''],
      ['1. Kolom "Nama Kelas":'],
      ['   - Format: Tingkat-Kelas (contoh: VII-A, VIII-B, IX-C)'],
      ['   - Harus diisi wajib'],
      ['   - Tidak boleh duplikat'],
      [''],
      ['2. Kolom "Wali Kelas":'],
      ['   - Nama lengkap wali kelas'],
      ['   - Bisa disertai gelar (contoh: Ahmad Suryadi, S.Pd.)'],
      ['   - Harus diisi wajib'],
      [''],
      ['3. Kolom "Keterangan":'],
      ['   - Opsional, bisa diisi atau dikosongkan'],
      ['   - Bisa berisi informasi tambahan'],
      [''],
      ['CATATAN PENTING:'],
      ['- Hapus atau edit data contoh sebelum mengunggah'],
      ['- Pastikan format nama kelas konsisten'],
      ['- Satu baris = satu kelas'],
      ['- Simpan file dalam format .xlsx atau .xls']
    ];

    const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);

    // Set column widths for instructions
    instructionsWs['!cols'] = [{ wch: 50 }];

    // Add instructions worksheet
    XLSX.utils.book_append_sheet(wb, instructionsWs, 'Petunjuk');

    // Generate and download file
    XLSX.writeFile(wb, 'template-import-kelas-bank-sampah.xlsx');
    toast.success('Template Excel berhasil diunduh');
  };

  // Mobile card component
  const ClassCard = ({ classData }: { classData: Class & { studentCount: number } }) => (
    <div className={`border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${selectedClasses.has(classData.id) ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
      <div className="flex justify-between items-start mb-2">
        <button
          onClick={() => handleSelectClass(classData.id)}
          className="text-gray-600 hover:text-gray-800"
        >
          {selectedClasses.has(classData.id) ? (
            <CheckSquare className="w-5 h-5" />
          ) : (
            <Square className="w-5 h-5" />
          )}
        </button>
        <div className="flex gap-1">
          <button
            onClick={() => {
              setEditingClass(classData);
              setShowForm(true);
            }}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(classData.id)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div>
        <h3 className="font-semibold text-gray-900">{classData.name}</h3>
        <p className="text-sm text-gray-600">Wali Kelas: {classData.teacher}</p>
        <button
          onClick={() => setSelectedClass(classData)}
          className="text-xs text-green-600 hover:text-green-800 mt-1 underline"
        >
          Jumlah Siswa: {classData.studentCount} siswa
        </button>
      </div>
    </div>
  );

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1 && filteredClasses.length <= classesPerPage) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;

      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);

        // Show ellipsis if needed
        if (currentPage > 3) {
          pages.push('ellipsis-start');
        }

        // Show pages around current page
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
          pages.push(i);
        }

        // Show ellipsis if needed
        if (currentPage < totalPages - 2) {
          pages.push('ellipsis-end');
        }

        // Always show last page
        if (totalPages > 1) {
          pages.push(totalPages);
        }
      }

      return pages;
    };

    // Mobile pagination component
    const MobilePagination = () => (
      <div className="flex flex-col sm:hidden gap-3 border-t border-gray-200 px-4 py-3">
        <div className="text-sm text-gray-700 text-center">
          Menampilkan {startIndex + 1}-{Math.min(startIndex + classesPerPage, filteredClasses.length)} dari {filteredClasses.length} kelas
        </div>
        <div className="flex items-center justify-center gap-2">
          <label htmlFor="mobile-items-per-page" className="text-sm text-gray-600">
            Tampilkan:
          </label>
          <select
            id="mobile-items-per-page"
            value={classesPerPage}
            onChange={(e) => handleClassesPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex-1 mr-2"
          >
            Sebelumnya
          </button>
          <div className="text-sm text-gray-600">
            Hal {currentPage} dari {totalPages}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex-1 ml-2"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    );

    // Desktop pagination component
    const DesktopPagination = () => (
      <div className="hidden sm:flex items-center justify-between border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Menampilkan {startIndex + 1} sampai {Math.min(startIndex + classesPerPage, filteredClasses.length)} dari {filteredClasses.length} kelas
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="items-per-page" className="text-sm text-gray-600">
              Tampilkan:
            </label>
            <select
              id="items-per-page"
              value={classesPerPage}
              onChange={(e) => handleClassesPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sebelumnya
          </button>

          {getPageNumbers().map((page, index) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <span key={index} className="px-2 py-1 text-sm text-gray-500">
                  ...
                </span>
              );
            }

            return (
              <button
                key={index}
                onClick={() => handlePageChange(page as number)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  currentPage === page
                    ? 'bg-green-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    );

    return (
      <>
        <MobilePagination />
        <DesktopPagination />
      </>
    );
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Data Kelas</h1>
          <p className="text-gray-600">Kelola data kelas Bank Sampah</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setEditingClass(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            Tambah Kelas
          </button>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
          >
            <Upload className="w-4 h-4" />
            Import Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Cari kelas..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1); // Reset to first page when searching
                }}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>
            {selectedClasses.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedClasses.size} kelas dipilih
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus ({selectedClasses.size})
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-900 w-12">
                  <button
                    onClick={handleSelectAll}
                    className="text-gray-600 hover:text-gray-800"
                  >
                    {selectedClasses.size === paginatedClasses.length && paginatedClasses.length > 0 ? (
                      <CheckSquare className="w-4 h-4" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">Nama Kelas</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">Wali Kelas</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">Jumlah Siswa</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedClasses.map((classData) => (
                <tr key={classData.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleSelectClass(classData.id)}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      {selectedClasses.has(classData.id) ? (
                        <CheckSquare className="w-4 h-4" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-sm font-medium text-gray-900">{classData.name}</td>
                  <td className="py-3 px-4 text-sm text-gray-900">{classData.teacher}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">
                    <button
                      onClick={() => setSelectedClass(classData)}
                      className="text-green-600 hover:text-green-800 underline"
                    >
                      {classData.studentCount} siswa
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => {
                          setEditingClass(classData);
                          setShowForm(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(classData.id)}
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

        {/* Mobile Card View */}
        <div className="md:hidden">
          <div className="space-y-4 p-4">
            {paginatedClasses.map((classData) => (
              <ClassCard key={classData.id} classData={classData} />
            ))}
          </div>
          {selectedClasses.size > 0 && (
            <div className="border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {selectedClasses.size} kelas dipilih
                </span>
                <button
                  onClick={handleBulkDelete}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Hapus ({selectedClasses.size})
                </button>
              </div>
            </div>
          )}
        </div>

        {filteredClasses.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'Tidak ada kelas yang cocok dengan pencarian' : 'Belum ada kelas'}
            </p>
          </div>
        )}

        {/* Pagination for both views */}
        <Pagination />
      </div>

      {showForm && (
        <ClassForm
          classData={editingClass}
          onClose={() => {
            setShowForm(false);
            setEditingClass(null);
          }}
          onSubmit={() => {
            setShowForm(false);
            setEditingClass(null);
            loadClasses();
          }}
        />
      )}

      {selectedClass && (
        <ClassDetails
          classId={selectedClass.id}
          className={selectedClass.name}
          onClose={() => setSelectedClass(null)}
          onStudentAdded={loadClasses}
        />
      )}

      {showImport && (
        <ImportClasses
          onClose={() => setShowImport(false)}
          onImportComplete={() => {
            setShowImport(false);
            loadClasses();
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && classToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Konfirmasi Hapus
            </h3>

            <p className="text-gray-600 text-center mb-6">
              Apakah Anda yakin ingin menghapus kelas ini?
              <br />
              <span className="font-medium text-gray-900">
                {classToDelete.name} - {classToDelete.teacher}
              </span>
              {classToDelete.studentCount > 0 && (
                <>
                  <br />
                  <span className="text-red-600 text-sm">
                    Tindakan ini juga akan menghapus {classToDelete.studentCount} siswa yang terdaftar di kelas ini.
                  </span>
                </>
              )}
            </p>

            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button
                onClick={cancelDelete}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Konfirmasi Hapus Banyak Kelas
            </h3>

            <p className="text-gray-600 text-center mb-6">
              Apakah Anda yakin ingin menghapus {selectedClasses.size} kelas yang dipilih?
              <br />
              <span className="font-medium text-gray-900">
                Tindakan ini tidak dapat dibatalkan.
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={confirmBulkDelete}
                disabled={bulkDeleting}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white rounded-lg transition-colors"
              >
                {bulkDeleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
              <button
                onClick={cancelBulkDelete}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}