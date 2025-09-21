import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { TrashbagWithdrawal } from '../../types';
import { CheckCircle, XCircle, Clock, ArrowDown } from 'lucide-react';
import toast from 'react-hot-toast';

export function TrashbagWithdrawalsManagement() {
  const [withdrawals, setWithdrawals] = useState<TrashbagWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);

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
                    
                    {withdrawal.status === 'pending' && (
                      <div className="flex gap-2 mt-2">
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
                      </div>
                    )}
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
    </div>
  );
}