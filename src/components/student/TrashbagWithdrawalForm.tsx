import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';
import { Gift, ShoppingBag, CheckCircle, AlertCircle } from 'lucide-react';

interface TrashbagWithdrawalFormProps {
  studentId: string;
  availableTrashbags: number;
  totalBottles: number;
  onWithdrawalSubmitted: () => void;
}

export function TrashbagWithdrawalForm({
  studentId,
  availableTrashbags,
  totalBottles,
  onWithdrawalSubmitted
}: TrashbagWithdrawalFormProps) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationError, setValidationError] = useState('');

  const validateAmount = (value: string): string => {
    const withdrawAmount = parseInt(value);

    if (!value) {
      return '';
    }

    if (isNaN(withdrawAmount) || withdrawAmount <= 0) {
      return 'Jumlah penarikan harus lebih dari 0';
    }

    if (withdrawAmount > availableTrashbags) {
      return `Maksimal penarikan adalah ${availableTrashbags} trashbag`;
    }

    return '';
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setValidationError(validateAmount(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Real-time validation check
    const currentError = validateAmount(amount);
    if (currentError) {
      toast.error(currentError);
      return;
    }

    const withdrawAmount = parseInt(amount);

    if (!description.trim()) {
      toast.error('Keterangan penarikan harus diisi');
      return;
    }

    setLoading(true);
    try {
      // Create withdrawal record
      const { error: withdrawalError } = await supabase
        .from('trashbag_withdrawals')
        .insert({
          student_id: studentId,
          amount: withdrawAmount,
          description: description.trim(),
          status: 'pending'
        });

      if (withdrawalError) throw withdrawalError;

      toast.success('Pengajuan penarikan trashbag berhasil dikirim');
      setAmount('');
      setDescription('');
      setValidationError('');
      onWithdrawalSubmitted();
    } catch (error) {
      console.error('Error submitting trashbag withdrawal:', error);
      toast.error('Gagal mengajukan penarikan trashbag');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-6">
      <div className="text-center">
        <div className="bg-gradient-to-r from-emerald-100 to-teal-100 p-3 rounded-full w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 shadow-lg">
          <ShoppingBag className="w-8 h-8 sm:w-12 sm:h-12 text-emerald-600" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-emerald-700 to-teal-700 bg-clip-text text-transparent mb-2">Penarikan Trashbag</h2>
        <p className="text-gray-600 text-sm sm:text-base">Ajukan penarikan trashbag reward yang telah Anda kumpulkan</p>
      </div>

      {/* Available Trashbags Info */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 sm:p-6 mb-6 border border-emerald-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Gift className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            <div>
              <p className="text-xs sm:text-sm text-emerald-700">Trashbag Tersedia</p>
              <p className="text-2xl sm:text-3xl font-bold text-emerald-800">{availableTrashbags}</p>
              <p className="text-xs text-emerald-600 mt-1">Maksimal penarikan</p>
            </div>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs sm:text-sm text-teal-700">Total Botol</p>
            <p className="text-lg sm:text-xl font-bold text-teal-800">{totalBottles.toLocaleString('id-ID')}</p>
            <p className="text-xs text-teal-600 mt-1">Telah dikumpulkan</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-emerald-200 rounded-full h-2 mb-2">
          <div
            className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((availableTrashbags / Math.max(availableTrashbags, 10)) * 100, 100)}%` }}
          ></div>
        </div>
        <p className="text-xs text-emerald-600 text-center">
          {availableTrashbags >= 10 ? 'Luar biasa! Anda telah mengumpulkan banyak trashbag' :
           availableTrashbags >= 5 ? 'Bagus! Terus kumpulkan botol untuk trashbag lebih banyak' :
           availableTrashbags >= 1 ? 'Mulai mengumpulkan! Anda bisa menarik trashbag sekarang' :
           'Kumpulkan botol untuk mendapatkan trashbag'}
        </p>
      </div>

      {/* Reward Benefits */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-3 sm:p-4 mb-6 border border-emerald-200 shadow-sm">
        <div className="flex items-start gap-2 sm:gap-3">
          <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-emerald-800 mb-2 text-sm sm:text-base">Keuntungan Trashbag:</h3>
            <ul className="text-xs sm:text-sm text-emerald-700 space-y-1">
              <li>• Tas ramah lingkungan untuk belanja sehari-hari</li>
              <li>• Mengurangi penggunaan plastik sekali pakai</li>
              <li>• Dapat digunakan berulang kali</li>
              <li>• Menunjukkan komitmen Anda terhadap lingkungan</li>
            </ul>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
            Jumlah Penarikan (Trashbag)
          </label>
          <input
            type="number"
            id="amount"
            value={amount}
            onChange={(e) => handleAmountChange(e.target.value)}
            placeholder="Masukkan jumlah trashbag yang ingin ditarik"
            min="1"
            max={availableTrashbags}
            className={`w-full px-3 sm:px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors shadow-sm ${
              validationError
                ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
                : 'border-gray-300 focus:ring-emerald-500 focus:border-transparent'
            }`}
            required
          />

          {/* Validation Messages */}
          <div className="mt-2 space-y-1">
            {validationError && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationError}
              </p>
            )}

            {amount && !validationError && (
              <p className="text-xs text-emerald-600 flex items-center gap-1">
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Jumlah valid
              </p>
            )}

            <p className="text-xs text-gray-500">
              Tersedia: <span className="font-medium text-emerald-600">{availableTrashbags}</span> trashbag
            </p>

            {amount && !validationError && (
              <p className="text-xs text-teal-600">
                Sisa trashbag setelah penarikan: <span className="font-medium">
                  {availableTrashbags - parseInt(amount || '0')}
                </span>
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Keterangan Penarikan
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan tujuan penarikan trashbag (contoh: untuk belanja, mengganti tas plastik, dll.)"
            rows={4}
            className="w-full px-3 sm:px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading || availableTrashbags <= 0 || !!validationError || !amount.trim()}
          className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          {loading ? 'Mengirim...' : 'Ajukan Penarikan Trashbag'}
        </button>
      </form>

      {availableTrashbags <= 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600" />
            <div>
              <p className="text-yellow-800 font-medium text-sm">Belum Ada Trashbag</p>
              <p className="text-yellow-700 text-xs sm:text-sm">
                Kumpulkan botol terlebih dahulu untuk mendapatkan trashbag reward.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-3 sm:p-4 border border-emerald-200 shadow-sm">
        <h4 className="font-medium text-emerald-800 mb-2 text-sm">Informasi Penting:</h4>
        <ul className="text-xs sm:text-sm text-emerald-700 space-y-1">
          <li>• Setiap pengajuan akan ditinjau oleh admin</li>
          <li>• Proses penarikan biasanya memakan waktu 1-3 hari kerja</li>
          <li>• Trashbag dapat diambil di ruang bank sampah</li>
          <li>• Pastikan keterangan penarikan jelas dan lengkap</li>
        </ul>
      </div>
    </div>
  );
}