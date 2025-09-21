import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { WasteType } from '../../types';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface WasteTypeFormProps {
  wasteType: WasteType | null;
  onClose: () => void;
  onSubmit: () => void;
}

export function WasteTypeForm({ wasteType, onClose, onSubmit }: WasteTypeFormProps) {
  const [formData, setFormData] = useState({
    name: wasteType?.name || '',
    trashbags_per_bottle: wasteType?.trashbags_per_bottle?.toString() || '20'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        name: formData.name,
        trashbags_per_bottle: parseInt(formData.trashbags_per_bottle)
      };

      if (wasteType) {
        const { error } = await supabase
          .from('waste_types')
          .update(data)
          .eq('id', wasteType.id);

        if (error) throw error;
        toast.success('Jenis sampah berhasil diperbarui');
      } else {
        const { error } = await supabase
          .from('waste_types')
          .insert(data);

        if (error) throw error;
        toast.success('Jenis sampah berhasil ditambahkan');
      }

      onSubmit();
    } catch (error) {
      console.error('Error saving waste type:', error);
      toast.error('Gagal menyimpan jenis sampah');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-4 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {wasteType ? 'Edit Jenis Sampah' : 'Tambah Jenis Sampah'}
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
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Nama Jenis Sampah
            </label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Plastik, Kertas, Kaleng"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label htmlFor="trashbags" className="block text-sm font-medium text-gray-700 mb-1">
              Reward (1 trashbag per X botol)
            </label>
            <input
              type="number"
              id="trashbags"
              value={formData.trashbags_per_bottle}
              onChange={(e) => setFormData({ ...formData, trashbags_per_bottle: e.target.value })}
              placeholder="Contoh: 20"
              min="1"
              step="1"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Contoh: 20 = siswa mendapatkan 1 trashbag untuk setiap 20 botol yang dikumpulkan
            </p>
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