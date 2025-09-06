import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Student } from '../../types';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { StudentForm } from './StudentForm';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

export function StudentsManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; errors: string[] } | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const studentsPerPage = 10;

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

  // Pagination logic
  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const startIndex = (currentPage - 1) * studentsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + studentsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Mobile card component
  const StudentCard = ({ student }: { student: Student }) => (
    <div className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-gray-900">{student.name}</h3>
          <p className="text-sm text-gray-600">NIS: {student.nis}</p>
          <p className="text-sm text-gray-600">Kelas: {student.class}</p>
          <p className="text-xs text-gray-500 mt-1">
            Bergabung: {new Date(student.created_at).toLocaleDateString('id-ID')}
          </p>
        </div>
        <div className="flex gap-1">
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
      </div>
    </div>
  );

  const handleImportExcel = async () => {
    if (!selectedFile) {
      toast.error('Silakan pilih file terlebih dahulu');
      return;
    }

    setImportLoading(true);
    setImportResult(null);

    try {
      // Membaca file Excel
      const data = await readExcelFile(selectedFile);
      
      // Validasi data
      const validatedData = validateStudentData(data);
      
      if (validatedData.errors.length > 0) {
        setImportResult({ success: 0, errors: validatedData.errors });
        toast.error('Terdapat kesalahan dalam data. Silakan periksa kembali.');
        setImportLoading(false);
        return;
      }

      // Simpan data ke database
      const result = await saveStudentsToDatabase(validatedData.validData);
      
      setImportResult(result);
      
      if (result.errors.length === 0) {
        toast.success(`Berhasil mengimpor ${result.success} siswa`);
        setShowImportModal(false);
        loadStudents(); // Refresh data
        setSelectedFile(null);
      } else {
        toast.error(`Gagal mengimpor ${result.errors.length} data. Silakan periksa kembali.`);
      }
    } catch (error) {
      console.error('Error importing students:', error);
      toast.error('Terjadi kesalahan saat mengimpor data');
    } finally {
      setImportLoading(false);
    }
  };

  const readExcelFile = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          let jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Normalize column names to lowercase
          jsonData = jsonData.map(row => {
            const normalizedRow: any = {};
            Object.keys(row).forEach(key => {
              // Convert column names to lowercase for consistent matching
              normalizedRow[key.toLowerCase()] = row[key];
            });
            return normalizedRow;
          });
          
          // Map common column variations to standard names
          jsonData = jsonData.map(row => {
            const normalizedRow: any = { ...row };
            
            // Handle NIS column variations
            if (!normalizedRow['nis']) {
              if (normalizedRow['nomor_induk_siswa'] !== undefined) {
                normalizedRow['nis'] = normalizedRow['nomor_induk_siswa'];
                delete normalizedRow['nomor_induk_siswa'];
              } else if (normalizedRow['no_induk'] !== undefined) {
                normalizedRow['nis'] = normalizedRow['no_induk'];
                delete normalizedRow['no_induk'];
              } else if (normalizedRow['student_id'] !== undefined) {
                normalizedRow['nis'] = normalizedRow['student_id'];
                delete normalizedRow['student_id'];
              }
            }
            
            // Handle name column variations
            if (!normalizedRow['name']) {
              if (normalizedRow['nama'] !== undefined) {
                normalizedRow['name'] = normalizedRow['nama'];
                delete normalizedRow['nama'];
              } else if (normalizedRow['nama_lengkap'] !== undefined) {
                normalizedRow['name'] = normalizedRow['nama_lengkap'];
                delete normalizedRow['nama_lengkap'];
              } else if (normalizedRow['student_name'] !== undefined) {
                normalizedRow['name'] = normalizedRow['student_name'];
                delete normalizedRow['student_name'];
              }
            }
            
            // Handle class column variations
            if (!normalizedRow['class']) {
              if (normalizedRow['kelas'] !== undefined) {
                normalizedRow['class'] = normalizedRow['kelas'];
                delete normalizedRow['kelas'];
              } else if (normalizedRow['class_name'] !== undefined) {
                normalizedRow['class'] = normalizedRow['class_name'];
                delete normalizedRow['class_name'];
              }
            }
            
            return normalizedRow;
          });
          
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  const validateStudentData = (data: any[]) => {
    const validData: Partial<Student>[] = [];
    const errors: string[] = [];

    // Check if data is empty
    if (data.length === 0) {
      errors.push('File kosong. Tidak ada data untuk diimpor.');
      return { validData, errors };
    }

    // Check if required columns exist (case insensitive)
    const firstRow = data[0];
    const columnNames = Object.keys(firstRow).map(key => key.toLowerCase());
    const requiredColumns = ['nis', 'name', 'class'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      errors.push(`Kolom wajib tidak ditemukan: ${missingColumns.join(', ')}. Kolom yang tersedia: ${columnNames.join(', ')}`);
      return { validData, errors };
    }

    data.forEach((row, index) => {
      const rowIndex = index + 2; // +2 because header is row 1, and we start counting from 1

      // Skip empty rows
      const rowValues = Object.values(row).map(val => String(val).trim());
      if (rowValues.every(val => val === '')) {
        return;
      }

      // Get values with proper column mapping
      const nisValue = String(row.nis || '').trim();
      const nameValue = String(row.name || '').trim();
      const classValue = String(row.class || '').trim();

      // Validate required fields
      if (!nisValue || !nameValue || !classValue) {
        errors.push(`Baris ${rowIndex}: Data tidak lengkap (NIS, Nama, dan Kelas harus diisi)`);
        return;
      }

      // Validate NIS format (must be numeric)
      if (!/^\d+$/.test(nisValue)) {
        errors.push(`Baris ${rowIndex}: Format NIS tidak valid (harus berupa angka)`);
        return;
      }

      // Validate NIS length (typically 3-20 digits)
      if (nisValue.length < 3 || nisValue.length > 20) {
        errors.push(`Baris ${rowIndex}: NIS harus terdiri dari 3-20 digit`);
        return;
      }

      // Validate name
      if (nameValue.length === 0) {
        errors.push(`Baris ${rowIndex}: Nama tidak boleh kosong`);
        return;
      }
      if (nameValue.length > 100) {
        errors.push(`Baris ${rowIndex}: Nama terlalu panjang (maksimal 100 karakter)`);
        return;
      }

      // Validate class
      if (classValue.length === 0) {
        errors.push(`Baris ${rowIndex}: Kelas tidak boleh kosong`);
        return;
      }
      if (classValue.length > 20) {
        errors.push(`Baris ${rowIndex}: Kelas terlalu panjang (maksimal 20 karakter)`);
        return;
      }

      // Check for duplicate NIS within the import file
      const duplicateNIS = validData.find(student => student.nis === nisValue);
      if (duplicateNIS) {
        errors.push(`Baris ${rowIndex}: NIS ${nisValue} sudah ada di baris sebelumnya dalam file ini`);
        return;
      }

      validData.push({
        nis: nisValue,
        name: nameValue,
        class: classValue
      });
    });

    // If no valid data after validation
    if (validData.length === 0 && errors.length === 0) {
      errors.push('Tidak ada data valid untuk diimpor. Periksa kembali format file Anda.');
    }

    return { validData, errors };
  };

  const saveStudentsToDatabase = async (students: Partial<Student>[]) => {
    let successCount = 0;
    const errors: string[] = [];

    // Process students one by one to handle errors individually
    for (const [index, student] of students.entries()) {
      try {
        // Check if student with same NIS already exists
        const { data: existingStudent, error: checkError } = await supabase
          .from('students')
          .select('id')
          .eq('nis', student.nis)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 means no rows returned, which is expected if student doesn't exist
          errors.push(`Baris ${index + 2}: Gagal memeriksa duplikasi untuk NIS ${student.nis}: ${checkError.message}`);
          continue;
        }

        if (existingStudent) {
          errors.push(`Baris ${index + 2}: NIS ${student.nis} sudah ada di database`);
          continue;
        }

        // Insert new student
        const { error: insertError } = await supabase
          .from('students')
          .insert({
            nis: student.nis,
            name: student.name,
            class: student.class
          });

        if (insertError) {
          errors.push(`Baris ${index + 2}: Gagal menyimpan ${student.name}: ${insertError.message}`);
        } else {
          successCount++;
        }
      } catch (error: any) {
        errors.push(`Baris ${index + 2}: Gagal menyimpan ${student.name}: ${error.message || 'Kesalahan tidak diketahui'}`);
      }
    }

    return { success: successCount, errors };
  };

  const checkForDuplicates = async (students: Partial<Student>[]): Promise<string[]> => {
    const errors: string[] = [];
    
    // Get all existing NIS from database
    try {
      const { data: existingStudents, error } = await supabase
        .from('students')
        .select('nis');
      
      if (error) {
        console.error('Error fetching existing students:', error);
        return ['Gagal memeriksa duplikasi data'];
      }
      
      const existingNIS = new Set(existingStudents.map(s => s.nis));
      
      // Check each student against existing NIS
      students.forEach((student, index) => {
        if (student.nis && existingNIS.has(student.nis)) {
          errors.push(`Baris ${index + 2}: NIS ${student.nis} sudah ada di database`);
        }
      });
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      errors.push('Gagal memeriksa duplikasi data');
    }
    
    return errors;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file terlalu besar. Maksimal 5MB.');
        return;
      }
      
      // Cek ekstensi file
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        toast.error('Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls)');
        return;
      }
      
      // Validate file name (prevent special characters that might cause issues)
      const fileName = file.name.replace(/\.(xlsx|xls)$/i, '');
      if (!/^[a-zA-Z0-9_\-\s()]+$/.test(fileName)) {
        toast.error('Nama file mengandung karakter yang tidak didukung. Gunakan huruf, angka, underscore, tanda hubung, atau spasi.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file terlalu besar. Maksimal 5MB.');
        return;
      }
      
      // Cek ekstensi file
      if (!file.name.match(/\.(xlsx|xls)$/i)) {
        toast.error('Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls)');
        return;
      }
      
      // Validate file name (prevent special characters that might cause issues)
      const fileName = file.name.replace(/\.(xlsx|xls)$/i, '');
      if (!/^[a-zA-Z0-9_\-\s()]+$/.test(fileName)) {
        toast.error('Nama file mengandung karakter yang tidak didukung. Gunakan huruf, angka, underscore, tanda hubung, atau spasi.');
        return;
      }
      
      setSelectedFile(file);
    }
  };

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1) return null;

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

    return (
      <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
        <div className="text-sm text-gray-700">
          Menampilkan {startIndex + 1} sampai {Math.min(startIndex + studentsPerPage, filteredStudents.length)} dari {filteredStudents.length} siswa
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
  };

  const downloadTemplate = () => {
    try {
      // Create worksheet data with more detailed instructions
      const templateData = [
        ['nis', 'name', 'class'],
        ['12345', 'Budi Santoso', 'X-A'],
        ['12346', 'Ani Wijaya', 'X-B'],
        ['12347', 'Candra Putra', 'XI-A']
      ];

      // Create workbook
      const ws = XLSX.utils.aoa_to_sheet(templateData);
      
      // Add styling to header row
      ws['A1'].s = { font: { bold: true } };
      ws['B1'].s = { font: { bold: true } };
      ws['C1'].s = { font: { bold: true } };

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Template Import Siswa');

      // Generate and download file
      XLSX.writeFile(wb, 'template_import_siswa.xlsx');
    } catch (error) {
      console.error('Error downloading template:', error);
      toast.error('Gagal mengunduh template');
    }
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
          <h1 className="text-2xl font-bold text-gray-900">Data Siswa</h1>
          <p className="text-gray-600">Kelola data siswa Bank Sampah</p>
        </div>
        <div className="flex gap-2">
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
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import Excel
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Cari siswa..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
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
              {paginatedStudents.map((student) => (
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

        {/* Mobile Card View */}
        <div className="md:hidden">
          <div className="space-y-4 p-4">
            {paginatedStudents.map((student) => (
              <StudentCard key={student.id} student={student} />
            ))}
          </div>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-10">
            <p className="text-gray-500 text-sm">
              {searchTerm ? 'Tidak ada siswa yang cocok dengan pencarian' : 'Belum ada siswa'}
            </p>
          </div>
        )}

        {/* Pagination for both views */}
        <Pagination />
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

      {/* Import Excel Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-200 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-xl">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Import Data Siswa</h3>
              </div>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                  setImportResult(null);
                }}
                className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 space-y-4 overflow-y-auto flex-1">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                <h4 className="font-medium text-blue-800 mb-1 flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Persyaratan Import Data
                </h4>
                <ul className="text-blue-700 space-y-1 list-disc pl-5 text-xs">
                  <li>File harus dalam format Excel (.xlsx atau .xls)</li>
                  <li>Ukuran maksimal file 5MB</li>
                  <li>Kolom wajib: <span className="font-medium">nis</span>, <span className="font-medium">name</span>, <span className="font-medium">class</span></li>
                  <li>NIS harus berupa angka dengan panjang 3-20 digit</li>
                  <li>Nama dan kelas tidak boleh kosong</li>
                  <li>Tidak boleh ada NIS yang duplikat</li>
                </ul>
              </div>
              <div 
                className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
                  isDragging ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-green-400 bg-gray-50 hover:bg-green-50'
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className={`p-3 rounded-full ${isDragging ? 'bg-green-100' : 'bg-gray-100'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-6 w-6 ${isDragging ? 'text-green-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      <span className={`underline ${isDragging ? 'text-green-600' : 'text-green-600 hover:text-green-700'}`}>Klik untuk mengunggah</span> atau seret file Excel ke sini
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Format yang didukung: .xlsx, .xls
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".xlsx,.xls"
                  onChange={handleFileSelect}
                />
              </div>
              
              {selectedFile && (
                <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {selectedFile.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                    <div className="bg-green-600 h-1.5 rounded-full w-full"></div>
                  </div>
                </div>
              )}
              
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                <div className="flex justify-center">
                  <button
                    onClick={downloadTemplate}
                    className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Download Template
                  </button>
                </div>
                
                <div className="mt-3 flex items-center gap-2 justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-xs text-blue-700">
                    Format yang didukung: <span className="font-medium">.xlsx</span> atau <span className="font-medium">.xls</span>
                  </p>
                </div>
              </div>
              
              {importResult && (
                <div className={`rounded-xl p-4 ${importResult.errors.length > 0 ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${importResult.errors.length > 0 ? 'bg-red-100' : 'bg-green-100'}`}>
                      {importResult.errors.length > 0 ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className={`text-sm font-semibold mb-1 ${importResult.errors.length > 0 ? 'text-red-800' : 'text-green-800'}`}>
                        {importResult.errors.length > 0 ? 'VALIDASI GAGAL' : 'IMPORT BERHASIL'}
                      </h4>
                      <p className="text-sm">
                        {importResult.errors.length > 0 ? (
                          <span>{importResult.errors.length} kesalahan ditemukan</span>
                        ) : (
                          <span><span className="font-medium">{importResult.success}</span> data berhasil diimport</span>
                        )}
                      </p>
                      
                      {importResult.errors.length > 0 && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-red-700 mb-2">Perincian Kesalahan:</p>
                          <div className="max-h-48 overflow-y-auto">
                            <ul className="text-xs space-y-2">
                              {importResult.errors.slice(0, 10).map((error, index) => (
                                <li key={index} className="flex items-start gap-2">
                                  <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>
                                  <span className="text-red-700">{error}</span>
                                </li>
                              ))}
                              {importResult.errors.length > 10 && (
                                <li className="text-xs text-red-700 font-medium">
                                  + {importResult.errors.length - 10} kesalahan lainnya
                                </li>
                              )}
                            </ul>
                          </div>
                          <div className="mt-3 p-3 bg-red-100 rounded-lg border border-red-200">
                            <p className="text-xs text-red-800">
                              <span className="font-medium">Tips:</span> Perbaiki kesalahan di atas dan coba kembali. 
                              Pastikan menggunakan <button 
                                onClick={downloadTemplate} 
                                className="underline font-medium hover:text-red-900"
                              >
                                template yang benar
                              </button>.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setSelectedFile(null);
                  setImportResult(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
                disabled={importLoading}
              >
                Batal
              </button>
              <button
                onClick={handleImportExcel}
                disabled={!selectedFile || importLoading}
                className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors flex items-center gap-2 ${
                  !selectedFile || importLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {importLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Mengimpor...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Import Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}