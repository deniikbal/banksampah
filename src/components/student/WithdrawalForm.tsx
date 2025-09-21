import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { ArrowDown, Wallet, Gift, Star } from 'lucide-react';

interface WithdrawalFormProps {
  studentId: string;
  currentBalance: number;
  totalTrashbags?: number;
  totalBottles?: number;
  onWithdrawalSubmitted: () => void;
}

export function WithdrawalForm({ studentId, currentBalance, totalTrashbags = 0, totalBottles = 0, onWithdrawalSubmitted }: WithdrawalFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount <= 0) {
      toast.error('Jumlah penarikan harus lebih dari 0');
      return;
    }

    if (withdrawAmount > currentBalance) {
      toast.error('Saldo tidak mencukupi');
      return;
    }

    if (!description.trim()) {
      toast.error('Keterangan penarikan harus diisi');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('withdrawals')
        .insert({
          student_id: studentId,
          amount: withdrawAmount,
          description: description.trim(),
          status: 'pending'
        });

      if (error) throw error;

      toast.success('Pengajuan penarikan berhasil dikirim');
      setAmount('');
      setDescription('');
      onWithdrawalSubmitted();
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error('Gagal mengajukan penarikan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center">
        <div className="bg-blue-100 p-4 rounded-full w-20 h-20 mx-auto mb-4">
          <ArrowDown className="w-12 h-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Penarikan Saldo</h2>
        <p className="text-gray-600">Ajukan penarikan saldo tabungan Anda</p>
      </div>

      {/* Reward Information */}
      {(totalTrashbags > 0 || totalBottles > 0) && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 mb-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="w-6 h-6 text-purple-600" />
            <h3 className="text-lg font-semibold text-purple-800">Reward Anda</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-pink-500" />
                <span className="text-sm text-gray-600">Total Trashbag</span>
              </div>
              <p className="text-xl font-bold text-purple-800 mt-1">{totalTrashbags}</p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-500" />
                <span className="text-sm text-gray-600">Total Botol</span>
              </div>
              <p className="text-xl font-bold text-blue-800 mt-1">{totalBottles.toLocaleString('id-ID')}</p>
            </div>
          </div>
          <div className="mt-4 p-3 bg-purple-100 rounded-lg">
            <p className="text-sm text-purple-700">
              <span className="font-semibold">Hebat!</span> Terus kumpulkan botol untuk mendapatkan lebih banyak trashbag.
            </p>
          </div>
        </div>
      )}

      <div className="bg-green-50 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-green-600" />
          <div>
            <p className="text-sm text-green-700">Saldo Tersedia</p>
            <p className="text-2xl font-bold text-green-800">
              Rp {currentBalance.toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Jumlah Penarikan (Rp)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Masukkan jumlah yang ingin ditarik"
            min="1"
            max={currentBalance}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Maksimal: Rp {currentBalance.toLocaleString('id-ID')}
          </p>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Keterangan Penarikan
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan tujuan penarikan (contoh: beli buku, bayar SPP, dll.)"
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || currentBalance <= 0}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
        >
          {loading ? 'Mengirim...' : 'Ajukan Penarikan'}
        </button>
      </form>

      {currentBalance <= 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 text-sm">
            Saldo Anda saat ini Rp 0. Setor sampah terlebih dahulu untuk menambah saldo.
          </p>
        </div>
      )}
    </div>
  );
}