import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { X, Upload, Download } from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface ImportClassesProps {
  onClose: () => void;
  onImportComplete: () => void;
}

export function ImportClasses({ onClose, onImportComplete }: ImportClassesProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [errors, setErrors] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseExcel(selectedFile);
    }
  };

  const parseExcel = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          setErrors(['File tidak memiliki data']);
          return;
        }

        const firstRow = jsonData[0] as any;
        const requiredHeaders = ['name', 'teacher'];
        const missingHeaders = requiredHeaders.filter(h => !(h in firstRow));

        if (missingHeaders.length > 0) {
          setErrors([`File harus memiliki kolom: ${missingHeaders.join(', ')}`]);
          return;
        }

        const parsedData = jsonData.map((row: any) => ({
          name: row.name || row['Nama Kelas'] || row['nama'] || '',
          teacher: row.teacher || row['Wali Kelas'] || row['wali kelas'] || ''
        })).filter(item => item.name && item.teacher);

        if (parsedData.length === 0) {
          setErrors(['Tidak ada data valid yang ditemukan']);
          return;
        }

        setParsedData(parsedData);
        setErrors([]);
      } catch (error) {
        setErrors(['Gagal membaca file. Pastikan file adalah Excel atau CSV yang valid.']);
        console.error('Error parsing file:', error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast.error('Tidak ada data untuk diimport');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('classes')
        .insert(parsedData);

      if (error) throw error;

      toast.success(`Berhasil mengimport ${parsedData.length} kelas`);
      onImportComplete();
      onClose();
    } catch (error: any) {
      console.error('Error importing classes:', error);
      toast.error(error.message || 'Gagal mengimport kelas');
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = 'name,teacher\n"X-A","Budi Santoso"\n"XI-B","Siti Aminah"\n"XII-C","Ahmad Wijaya"';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'template_kelas.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl">
        <div className="flex justify-between items-center border-b border-gray-200 p-4">
          <h2 className="text-lg font-bold text-gray-900">
            Import Data Kelas
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-800">Template Import</h3>
            </div>
            <p className="text-xs text-blue-700 mb-2">
              Download template untuk memastikan format data yang benar
            </p>
            <button
              onClick={downloadTemplate}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition-colors"
            >
              Download Template CSV
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="flex text-sm text-gray-600">
              <label className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500">
                <span>{file ? file.name : 'Pilih file'}</span>
                <input
                  type="file"
                  className="sr-only"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileChange}
                />
              </label>
              <p className="pl-1">atau drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">
              File Excel/CSV dengan kolom: name, teacher (atau Nama Kelas, Wali Kelas)
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
                Berhasil mem-parsing {parsedData.length} kelas
              </h3>
              <div className="mt-2 max-h-40 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Nama Kelas</th>
                      <th className="px-2 py-1 text-left text-xs font-medium text-gray-500 uppercase">Wali Kelas</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedData.slice(0, 5).map((classItem, index) => (
                      <tr key={index}>
                        <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900">{classItem.name}</td>
                        <td className="px-2 py-1 whitespace-nowrap text-sm text-gray-900">{classItem.teacher}</td>
                      </tr>
                    ))}
                    {parsedData.length > 5 && (
                      <tr>
                        <td colSpan={2} className="px-2 py-1 text-sm text-gray-500 text-center">
                          ... dan {parsedData.length - 5} kelas lainnya
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
                  Import Kelas
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}