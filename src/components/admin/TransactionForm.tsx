import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Student, WasteType, Transaction } from '../../types';
import { X, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { StudentForm } from './StudentForm';

interface TransactionFormProps {
  transactionData?: Transaction | null;
  onClose: () => void;
  onSubmit: () => void;
}

export function TransactionForm({ transactionData, onClose, onSubmit }: TransactionFormProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [formData, setFormData] = useState({
    student_id: '',
    waste_type_id: '',
    bottle_count: ''
  });
  const [loading, setLoading] = useState(false);
  const [showStudentForm, setShowStudentForm] = useState(false);

  useEffect(() => {
    loadData();
    if (transactionData) {
      // Use bottle_count directly if available, otherwise calculate from weight (for legacy data)
      let bottleCount = 0;
      if (transactionData.bottle_count && transactionData.bottle_count > 0) {
        bottleCount = transactionData.bottle_count;
      } else {
        // Legacy data: bottle_count should be available, fallback to 0
        bottleCount = transactionData.bottle_count || 0;
      }

      setFormData({
        student_id: transactionData.student_id,
        waste_type_id: transactionData.waste_type_id,
        bottle_count: bottleCount.toString()
      });
    }
  }, [transactionData]);

  const loadData = async () => {
    try {
      const [studentsRes, wasteTypesRes] = await Promise.all([
        supabase.from('students').select('*').order('name'),
        supabase.from('waste_types').select('*').order('name')
      ]);

      setStudents(studentsRes.data || []);
      setWasteTypes(wasteTypesRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Gagal memuat data');
    }
  };

  const handleStudentCreated = (newStudent: Student) => {
    setStudents(prev => [...prev, newStudent]);
    setFormData(prev => ({ ...prev, student_id: newStudent.id }));
    setShowStudentForm(false);
  };

  const selectedWasteType = wasteTypes.find(wt => wt.id === formData.waste_type_id);
  const bottleCount = formData.bottle_count ? parseInt(formData.bottle_count) : 0;

  // Calculate trashbag reward
  const trashbagReward = selectedWasteType && bottleCount > 0
    ? Math.floor(bottleCount / selectedWasteType.trashbags_per_bottle)
    : 0;

  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bottleCount = parseInt(formData.bottle_count);
      const selectedWasteType = wasteTypes.find(wt => wt.id === formData.waste_type_id);

      if (!selectedWasteType) {
        toast.error('Jenis sampah tidak valid');
        return;
      }

      // No need to calculate weight anymore - using bottle_count directly

      // Check if updated_at column exists by trying a simple query first
      let hasUpdatedAtColumn = false;
      try {
        const { data: testData, error: testError } = await supabase
          .from('transactions')
          .select('updated_at')
          .limit(1);

        if (!testError) {
          hasUpdatedAtColumn = true;
        }
      } catch (e) {
        // Column doesn't exist, will handle gracefully
        console.log('updated_at column may not exist in the database schema');
      }

      if (transactionData) {
        // Update existing transaction - save bottle_count and trashbag_reward directly
        const updateData: any = {
          student_id: formData.student_id,
          waste_type_id: formData.waste_type_id,
          bottle_count: bottleCount,
          trashbag_reward: trashbagReward
        };

        // Only include updated_at if the column exists
        if (hasUpdatedAtColumn) {
          updateData.updated_at = new Date().toISOString();
        }

        const { error: transactionError } = await supabase
          .from('transactions')
          .update(updateData)
          .eq('id', transactionData.id);

        if (transactionError) throw transactionError;
        toast.success('Transaksi berhasil diperbarui!');
      } else {
        // Insert new transaction - save bottle_count and trashbag_reward directly
        const insertData: any = {
          student_id: formData.student_id,
          waste_type_id: formData.waste_type_id,
          bottle_count: bottleCount,
          trashbag_reward: trashbagReward
        };

        const { error: transactionError } = await supabase
          .from('transactions')
          .insert(insertData);

        if (transactionError) throw transactionError;
        toast.success(`Setoran berhasil dicatat! Siswa mendapatkan ${trashbagReward} trashbag.`);
      }

      onSubmit();
    } catch (error) {
      console.error('Error saving transaction:', error);
      toast.error('Gagal menyimpan transaksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {transactionData ? 'Edit Transaksi' : 'Input Setoran Sampah'}
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
            <label htmlFor="student" className="block text-sm font-medium text-gray-700 mb-1">
              Siswa
            </label>
            <div className="relative">
              <select
                id="student"
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-3 py-2 pr-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none"
                required
              >
                <option value="">Pilih Siswa</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name} - {student.class}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setShowStudentForm(true)}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Tambah Siswa Baru"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {students.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Belum ada data siswa. Klik tombol + untuk menambah siswa baru.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="waste-type" className="block text-sm font-medium text-gray-700 mb-1">
              Jenis Sampah
            </label>
            <select
              id="waste-type"
              value={formData.waste_type_id}
              onChange={(e) => setFormData({ ...formData, waste_type_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Pilih Jenis Sampah</option>
              {wasteTypes.map((wasteType) => (
                <option key={wasteType.id} value={wasteType.id}>
                  {wasteType.name} (1 trashbag per {wasteType.trashbags_per_bottle} botol)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="bottle-count" className="block text-sm font-medium text-gray-700 mb-1">
              Jumlah Botol
            </label>
            <input
              type="number"
              id="bottle-count"
              value={formData.bottle_count}
              onChange={(e) => setFormData({ ...formData, bottle_count: e.target.value })}
              placeholder="Contoh: 10"
              min="1"
              step="1"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            {transactionData && (
              <p className="text-xs text-gray-500 mt-1">
                Note: Perubahan jumlah botol akan mempengaruhi reward trashbag
              </p>
            )}
          </div>

          {trashbagReward > 0 && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-700">Reward Trashbag</p>
              <div className="space-y-2">
                <div className="bg-yellow-100 rounded-md p-3">
                  <p className="text-2xl font-bold text-yellow-800 text-center">
                    🎁 {trashbagReward} Trashbag
                  </p>
                  <p className="text-xs text-yellow-700 text-center">
                    {bottleCount} botol ÷ {selectedWasteType?.trashbags_per_bottle} botol/trashbag
                  </p>
                </div>
                {bottleCount % selectedWasteType.trashbags_per_bottle > 0 && (
                  <p className="text-xs text-green-600 text-center">
                    Sisa {bottleCount % selectedWasteType.trashbags_per_bottle} botol menuju trashbag berikutnya!
                  </p>
                )}
              </div>
            </div>
          )}

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
              disabled={loading || !formData.student_id || !formData.waste_type_id || !formData.bottle_count}
              className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors text-sm"
            >
              {loading ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>

        {showStudentForm && (
          <StudentForm
            student={null}
            onClose={() => setShowStudentForm(false)}
            onSubmit={() => {
              // Reload students data after creating new student
              loadData();
              setShowStudentForm(false);
            }}
          />
        )}
      </div>
    </div>
  );
}