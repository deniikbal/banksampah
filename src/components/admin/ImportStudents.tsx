import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Class } from '../../types';
import { X, Upload } from 'lucide-react';
import toast from 'react-hot-toast';

interface ImportStudentsProps {
  classData: Class;
  onClose: () => void;
  onImportComplete: () => void;
}

export function ImportStudents({ classData, onClose, onImportComplete }: ImportStudentsProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSV(selectedFile);
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim().replace(/['"]+/g, ''));
      
      const requiredHeaders = ['nis', 'name'];
      const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
      
      if (missingHeaders.length > 0) {
        setErrors([`File harus memiliki kolom: ${missingHeaders.join(', ')}`]);
        return;
      }
      
      const nisIndex = headers.indexOf('nis');
      const nameIndex = headers.indexOf('name');
      
      const data = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (line) {
          const values = line.split(',').map(v => v.trim().replace(/['"]+/g, ''));
          if (values[nisIndex] && values[nameIndex]) {
            data.push({
              nis: values[nisIndex],
              name: values[nameIndex]
            });
          }
        }
      }
      
      setParsedData(data);
      setErrors([]);
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error('Tidak ada data untuk diimport');
      return;
    }

    setLoading(true);
    try {
      // Insert students in batches to avoid timeout issues
      const batchSize = 100;
      for (let i = 0; i < parsedData.length; i += batchSize) {
        const batch = parsedData.slice(i, i + batchSize);
        const studentsWithClass = batch.map(student => ({
          ...student,
          class: classData.id
        }));

        const { error } = await supabase
          .from('students')
          .insert(studentsWithClass);

        if (error) throw error;
      }

      toast.success(`Berhasil mengimport ${parsedData.length} siswa`);
      onImportComplete();
      onClose();
    } catch (error: any) {
      console.error('Error importing students:', error);
      toast.error(error.message || 'Gagal mengimport siswa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center border-b border-gray-200 p-4">
          <h2 className="text-lg font-bold text-gray-900">
            Import Siswa ke Kelas {classData.name}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500">
                <span>{file ? file.name : 'Pilih file'}</span>
                <input
                  type="file"
                  className="sr-only"
                  accept=".csv"
                  onChange={handleFileChange}
                />
              </label>
              <p className="pl-1">atau drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              File CSV dengan kolom: nis, name
            </p>
          </div>

          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h3 className="text-sm font-medium text-red-800">Error:</h3>
              <ul className="mt-1 text-sm text-red-700 list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <h3 className="text-sm font-medium text-green-800">
                Berhasil mem-parsing {parsedData.length} siswa
              </h3>
              <div className="mt-2 max-h-40 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedData.slice(0, 5).map((student, index) => (
                      <tr key={index}>
                        <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900">{student.nis}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900">{student.name}</td>
                      </tr>
                    ))}
                    {parsedData.length > 5 && (
                      <tr>
                        <td colSpan={2} className="px-2 py-1 text-sm text-gray-500 text-center">
                          ... dan {parsedData.length - 5} siswa lainnya
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4">
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleImport}
              disabled={loading || parsedData.length === 0}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Mengimport...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Siswa
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}