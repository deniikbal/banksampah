import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Student, WasteType } from '../../types';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface TransactionFormProps {
  onClose: () => void;
  onSubmit: () => void;
}

export function TransactionForm({ onClose, onSubmit }: TransactionFormProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [formData, setFormData] = useState({
    student_id: '',
    waste_type_id: '',
    weight: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

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

  const selectedWasteType = wasteTypes.find(wt => wt.id === formData.waste_type_id);
  const calculatedValue = selectedWasteType && formData.weight 
    ? parseFloat(formData.weight) * selectedWasteType.price_per_kg 
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const weight = parseFloat(formData.weight);
      
      // Insert transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          student_id: formData.student_id,
          waste_type_id: formData.waste_type_id,
          weight,
          total_value: calculatedValue
        });

      if (transactionError) throw transactionError;

      // Update student balance
      const { data: currentSavings, error: savingsSelectError } = await supabase
        .from('savings')
        .select('balance')
        .eq('student_id', formData.student_id)
        .single();

      if (savingsSelectError) throw savingsSelectError;

      const { error: savingsUpdateError } = await supabase
        .from('savings')
        .update({
          balance: (currentSavings.balance || 0) + calculatedValue,
          updated_at: new Date().toISOString()
        })
        .eq('student_id', formData.student_id);

      if (savingsUpdateError) throw savingsUpdateError;

      toast.success('Transaksi berhasil dicatat dan saldo siswa telah diperbarui');
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
          <h2 className="text-lg font-bold text-gray-900">Input Setoran Sampah</h2>
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
            <select
              id="student"
              value={formData.student_id}
              onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            >
              <option value="">Pilih Siswa</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} - {student.class}
                </option>
              ))}
            </select>
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
                  {wasteType.name} - Rp {wasteType.price_per_kg.toLocaleString('id-ID')}/kg
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
              Berat (kg)
            </label>
            <input
              type="number"
              id="weight"
              value={formData.weight}
              onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
              placeholder="Contoh: 1.5"
              min="0.1"
              step="0.1"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          {calculatedValue > 0 && (
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-sm text-green-700">Nilai Setoran</p>
              <p className="text-xl font-bold text-green-800">
                Rp {calculatedValue.toLocaleString('id-ID')}
              </p>
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
              disabled={loading || calculatedValue === 0}
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