import React from 'react';
import { Transaction, Withdrawal, WasteType, TrashbagWithdrawal } from '../../types';
import { Package, ArrowDown, Clock, CheckCircle, XCircle, Gift, TrendingUp } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  withdrawals: Withdrawal[];
  trashbagWithdrawals?: TrashbagWithdrawal[];
  wasteTypes?: WasteType[];
}

export function TransactionHistory({
  transactions,
  withdrawals,
  trashbagWithdrawals = [],
  wasteTypes = []
}: TransactionHistoryProps) {
  // const [activeTab, setActiveTab] = useState<'history' | 'withdraw'>('history');
  
  const calculateReward = (transaction: Transaction) => {
    const wasteType = wasteTypes.find(wt => wt.id === transaction.waste_type_id);
    if (!wasteType) return { bottles: 0, trashbags: 0 };

    // Gunakan bottle_count asli jika tersedia
    let bottleCount = 0;
    if (transaction.bottle_count && transaction.bottle_count > 0) {
      bottleCount = transaction.bottle_count;
    } else {
      // Legacy data: gunakan bottle_count yang sudah ada
      bottleCount = transaction.bottle_count || 0;
    }

    // Gunakan trashbag_reward asli jika tersedia
    let trashbagCount = 0;
    if (transaction.trashbag_reward && transaction.trashbag_reward > 0) {
      trashbagCount = transaction.trashbag_reward;
    } else {
      trashbagCount = Math.floor(bottleCount / wasteType.trashbags_per_bottle);
    }

    return { bottles: bottleCount, trashbags: trashbagCount };
  };

  const allHistory = [
    ...transactions.map(t => {
      const reward = calculateReward(t);
      return {
        ...t,
        type: 'deposit' as const,
        title: `Setoran ${t.waste_type?.name}`,
        amount: 0, // Sistem sekarang menggunakan trashbag reward, bukan nilai uang
        description: `${t.bottle_count} botol`,
        reward: reward
      };
    }),
    ...withdrawals.map(w => ({
      ...w,
      type: 'withdrawal' as const,
      title: 'Penarikan Saldo',
      amount: w.amount,
      description: w.description
    })),
    ...trashbagWithdrawals.map(tw => ({
      ...tw,
      type: 'trashbag_withdrawal' as const,
      title: 'Penarikan Trashbag',
      amount: tw.amount,
      description: tw.description
    }))
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return CheckCircle;
      case 'rejected': return XCircle;
      default: return Clock;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Package className="w-6 h-6 text-emerald-600" />
          Riwayat Transaksi
        </h2>
        <div className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
          Total {allHistory.length} transaksi
        </div>
      </div>


      {/* Riwayat Transaksi */}
        <>
          {allHistory.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-4 rounded-full w-20 h-20 mx-auto mb-4">
                <Package className="w-12 h-12 text-emerald-500" />
              </div>
              <p className="text-gray-600 text-lg">Belum ada riwayat transaksi</p>
              <p className="text-gray-500 text-sm mt-2">Mulai kumpulkan botol untuk mendapatkan reward!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allHistory.map((item) => {
                const isDeposit = item.type === 'deposit';
                const isWithdrawal = item.type === 'withdrawal';
                const isTrashbagWithdrawal = item.type === 'trashbag_withdrawal';
                const StatusIcon = (isWithdrawal || isTrashbagWithdrawal) ? getStatusIcon(item.status) : null;
                const hasReward = isDeposit && item.reward && (item.reward.bottles > 0 || item.reward.trashbags > 0);

                return (
                  <div key={item.id} className="bg-gradient-to-br from-white to-gray-50 border border-gray-100 rounded-2xl p-5 hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${
                          isDeposit ? 'bg-gradient-to-br from-emerald-100 to-teal-100' :
                          isWithdrawal ? 'bg-gradient-to-br from-blue-100 to-cyan-100' : 'bg-gradient-to-br from-purple-100 to-pink-100'
                        }`}>
                          {isDeposit ? (
                            <Package className="w-6 h-6 text-emerald-600" />
                          ) : isWithdrawal ? (
                            <ArrowDown className="w-6 h-6 text-blue-600" />
                          ) : (
                            <Gift className="w-6 h-6 text-purple-600" />
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                          <p className="text-gray-600 text-sm">{item.description}</p>
                          {hasReward && (
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-1 bg-purple-100 px-2 py-1 rounded-full">
                                <TrendingUp className="w-3 h-3 text-purple-600" />
                                <span className="text-xs text-purple-700 font-medium">
                                  {item.reward.bottles} botol
                                </span>
                              </div>
                              {item.reward.trashbags > 0 && (
                                <div className="flex items-center gap-1 bg-pink-100 px-2 py-1 rounded-full">
                                  <Gift className="w-3 h-3 text-pink-600" />
                                  <span className="text-xs text-pink-700 font-medium">
                                    {item.reward.trashbags} trashbag
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(item.created_at).toLocaleDateString('id-ID', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                      </div>

                      <div className="text-right sm:text-right">
                        {isDeposit && item.amount > 0 && (
                          <p className="text-lg font-bold text-green-600">
                            +Rp {item.amount.toLocaleString('id-ID')}
                          </p>
                        )}
                        {isWithdrawal && item.amount > 0 && (
                          <p className="text-lg font-bold text-blue-600">
                            -Rp {item.amount.toLocaleString('id-ID')}
                          </p>
                        )}
                        {isTrashbagWithdrawal && (
                          <p className="text-lg font-bold text-purple-600">
                            -{item.amount} trashbag
                          </p>
                        )}
                        {hasReward && item.reward.trashbags > 0 && (
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <Gift className="w-4 h-4 text-pink-500" />
                            <span className="text-xs text-pink-600 font-medium">
                              +{item.reward.trashbags} trashbag
                            </span>
                          </div>
                        )}
                        {(isWithdrawal || isTrashbagWithdrawal) && StatusIcon && (
                          <div className="flex items-center gap-1 justify-end mt-1">
                            <StatusIcon className={`w-3 h-3 ${getStatusColor(item.status)}`} />
                            <span className={`text-xs font-medium ${getStatusColor(item.status)}`}>
                              {item.status === 'pending' ? 'Menunggu' :
                               item.status === 'approved' ? 'Disetujui' : 'Ditolak'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
    </div>
  );
}