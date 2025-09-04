import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Transaction, Student, WasteType } from '../../types';
import { Plus, TrendingUp } from 'lucide-react';
import { TransactionForm } from './TransactionForm';
import toast from 'react-hot-toast';

export function TransactionsManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          student:students(*),
          waste_type:waste_types(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Transaksi Setoran</h1>
          <p className="text-gray-600">Kelola setoran sampah siswa</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Input Setoran
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Riwayat Transaksi</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">Tanggal</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">Siswa</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">Jenis Sampah</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-900">Berat (kg)</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-900">Nilai (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{transaction.student?.name}</p>
                      <p className="text-xs text-gray-600">{transaction.student?.class}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">{transaction.waste_type?.name}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900 text-sm">
                    {transaction.weight.toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-green-600 text-sm">
                    {transaction.total_value.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-10">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Belum ada transaksi</p>
          </div>
        )}
      </div>

      {showForm && (
        <TransactionForm
          onClose={() => setShowForm(false)}
          onSubmit={() => {
            setShowForm(false);
            loadTransactions();
          }}
        />
      )}
    </div>
  );
}