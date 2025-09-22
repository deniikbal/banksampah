import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrashbagWithdrawal } from '../../types';
import { CheckCircle, XCircle, Clock, ArrowDown, Package, TrendingUp, Users, Calendar, Edit2, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export function TrashbagWithdrawalsManagement() {
  const [withdrawals, setWithdrawals] = useState<TrashbagWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWithdrawal, setEditingWithdrawal] = useState<TrashbagWithdrawal | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingWithdrawal, setDeletingWithdrawal] = useState<TrashbagWithdrawal | null>(null);
  const [editForm, setEditForm] = useState({
    amount: '',
    description: ''
  });

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    try {
      const { data, error } = await supabase
        .from('trashbag_withdrawals')
        .select(`
          *,
          student:students(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWithdrawals(data || []);
    } catch (error) {
      console.error('Error loading trashbag withdrawals:', error);
      toast.error('Gagal memuat data penarikan trashbag');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = {
    total: withdrawals.length,
    pending: withdrawals.filter(w => w.status === 'pending').length,
    approved: withdrawals.filter(w => w.status === 'approved').length,
    rejected: withdrawals.filter(w => w.status === 'rejected').length,
    totalTrashbags: withdrawals.reduce((sum, w) => sum + w.amount, 0),
    approvedTrashbags: withdrawals.filter(w => w.status === 'approved').reduce((sum, w) => sum + w.amount, 0),
    pendingTrashbags: withdrawals.filter(w => w.status === 'pending').reduce((sum, w) => sum + w.amount, 0)
  };

  const handleStatusUpdate = async (withdrawalId: string, status: 'approved' | 'rejected') => {
    try {
      // Update trashbag withdrawal status
      const { error: withdrawalError } = await supabase
        .from('trashbag_withdrawals')
        .update({ status })
        .eq('id', withdrawalId);

      if (withdrawalError) throw withdrawalError;

      toast.success(`Penarikan ${status === 'approved' ? 'disetujui' : 'ditolak'}`);
      loadWithdrawals();
    } catch (error) {
      console.error('Error updating trashbag withdrawal:', error);
      toast.error('Gagal memperbarui status penarikan trashbag');
    }
  };

  const handleEdit = (withdrawal: TrashbagWithdrawal) => {
    setEditingWithdrawal(withdrawal);
    setEditForm({
      amount: withdrawal.amount.toString(),
      description: withdrawal.description || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!editingWithdrawal) return;

    try {
      const { error } = await supabase
        .from('trashbag_withdrawals')
        .update({
          amount: parseInt(editForm.amount),
          description: editForm.description
        })
        .eq('id', editingWithdrawal.id);

      if (error) throw error;

      toast.success('Data penarikan berhasil diperbarui');
      setShowEditModal(false);
      setEditingWithdrawal(null);
      loadWithdrawals();
    } catch (error) {
      console.error('Error updating withdrawal:', error);
      toast.error('Gagal memperbarui data penarikan');
    }
  };

  const handleDelete = (withdrawal: TrashbagWithdrawal) => {
    setDeletingWithdrawal(withdrawal);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingWithdrawal) return;

    try {
      const { error } = await supabase
        .from('trashbag_withdrawals')
        .delete()
        .eq('id', deletingWithdrawal.id);

      if (error) throw error;

      toast.success('Penarikan berhasil dihapus');
      setShowDeleteModal(false);
      setDeletingWithdrawal(null);
      loadWithdrawals();
    } catch (error) {
      console.error('Error deleting withdrawal:', error);
      toast.error('Gagal menghapus penarikan');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      default: return Clock;
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Kelola Penarikan Trashbag</h1>
        <p className="text-gray-600 text-sm">Setujui atau tolak pengajuan penarikan trashbag</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Package className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="text-xs text-gray-600">Total Pengajuan</h3>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats.total}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <h3 className="text-xs text-gray-600">Menunggu</h3>
          </div>
          <p className="text-xl font-bold text-yellow-600">{stats.pending}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <h3 className="text-xs text-gray-600">Disetujui</h3>
          </div>
          <p className="text-xl font-bold text-green-600">{stats.approved}</p>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-red-100 p-2 rounded-lg">
              <XCircle className="w-4 h-4 text-red-600" />
            </div>
            <h3 className="text-xs text-gray-600">Ditolak</h3>
          </div>
          <p className="text-xl font-bold text-red-600">{stats.rejected}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-700 font-medium">Total Trashbag Diajukan</p>
              <p className="text-xl font-bold text-blue-800">{stats.totalTrashbags} trashbag</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-700 font-medium">Total Trashbag Disetujui</p>
              <p className="text-xl font-bold text-green-800">{stats.approvedTrashbags} trashbag</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-xl p-4 border border-yellow-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-yellow-700 font-medium">Trashbag Menunggu</p>
              <p className="text-xl font-bold text-yellow-800">{stats.pendingTrashbags} trashbag</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Daftar Pengajuan Penarikan Trashbag</h3>
        </div>

        <div className="divide-y divide-gray-200">
          {withdrawals.map((withdrawal) => {
            const StatusIcon = getStatusIcon(withdrawal.status);
            
            return (
              <div key={withdrawal.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      <ArrowDown className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{withdrawal.student?.name}</h3>
                      <p className="text-sm text-gray-600">{withdrawal.student?.class}</p>
                      <p className="text-gray-600 text-sm mt-1">{withdrawal.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(withdrawal.created_at).toLocaleDateString('id-ID', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right sm:text-right">
                    <p className="text-lg font-bold text-blue-600">
                      {withdrawal.amount} trashbag
                    </p>
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal.status)}`}>
                      <StatusIcon className="w-3 h-3" />
                      {withdrawal.status === 'pending' ? 'Menunggu' :
                       withdrawal.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                    </div>
                    
                    <div className="flex gap-2 mt-2">
                      {withdrawal.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusUpdate(withdrawal.id, 'approved')}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Setuju
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(withdrawal.id, 'rejected')}
                            className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                          >
                            Tolak
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => handleEdit(withdrawal)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleDelete(withdrawal)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {withdrawals.length === 0 && (
          <div className="text-center py-10">
            <ArrowDown className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Belum ada pengajuan penarikan trashbag</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Penarikan Trashbag</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jumlah Trashbag
                </label>
                <input
                  type="number"
                  value={editForm.amount}
                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Deskripsi
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="3"
                  placeholder="Tambahkan deskripsi jika diperlukan"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={handleUpdate}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Simpan Perubahan
              </button>
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded-lg transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deletingWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>

            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Konfirmasi Hapus
            </h3>

            <p className="text-gray-600 text-center mb-6">
              Apakah Anda yakin ingin menghapus penarikan ini?
              <br />
              <span className="font-medium text-gray-900">
                {deletingWithdrawal.amount} trashbag dari {deletingWithdrawal.student?.name}
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingWithdrawal(null);
                }}
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