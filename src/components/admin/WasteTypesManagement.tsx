import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { WasteType } from '../../types';
import { Plus, Edit, Trash2, Package } from 'lucide-react';
import { WasteTypeForm } from './WasteTypeForm';
import toast from 'react-hot-toast';

export function WasteTypesManagement() {
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingWasteType, setEditingWasteType] = useState<WasteType | null>(null);

  useEffect(() => {
    loadWasteTypes();
  }, []);

  const loadWasteTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('waste_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWasteTypes(data || []);
    } catch (error) {
      console.error('Error loading waste types:', error);
      toast.error('Gagal memuat data jenis sampah');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus jenis sampah ini?')) return;

    try {
      const { error } = await supabase
        .from('waste_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Jenis sampah berhasil dihapus');
      loadWasteTypes();
    } catch (error) {
      console.error('Error deleting waste type:', error);
      toast.error('Gagal menghapus jenis sampah');
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
          <h1 className="text-2xl font-bold text-gray-900">Jenis Sampah</h1>
          <p className="text-gray-600">Kelola jenis dan harga sampah</p>
        </div>
        <button
          onClick={() => {
            setEditingWasteType(null);
            setShowForm(true);
          }}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Tambah Jenis
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {wasteTypes.map((wasteType) => (
          <div key={wasteType.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-2 rounded-lg">
                  <Package className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{wasteType.name}</h3>
                  <p className="text-xs text-gray-500">
                    {new Date(wasteType.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    setEditingWasteType(wasteType);
                    setShowForm(true);
                  }}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(wasteType.id)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3">
              <p className="text-xs text-green-600">Reward System</p>
              <p className="text-lg font-bold text-green-800">
                1 trashbag per {wasteType.trashbags_per_bottle} botol
              </p>
              <p className="text-xs text-green-600 mt-1">
                Siswa mendapatkan trashbag setiap mengumpulkan {wasteType.trashbags_per_bottle} botol
              </p>
            </div>
          </div>
        ))}
      </div>

      {wasteTypes.length === 0 && (
        <div className="text-center py-10">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Belum ada jenis sampah</p>
        </div>
      )}

      {showForm && (
        <WasteTypeForm
          wasteType={editingWasteType}
          onClose={() => {
            setShowForm(false);
            setEditingWasteType(null);
          }}
          onSubmit={() => {
            setShowForm(false);
            setEditingWasteType(null);
            loadWasteTypes();
          }}
        />
      )}
    </div>
  );
}