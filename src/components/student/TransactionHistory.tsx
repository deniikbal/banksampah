import React from 'react';
import { Transaction, Withdrawal } from '../../types';
import { Package, ArrowDown, Clock, CheckCircle, XCircle } from 'lucide-react';

interface TransactionHistoryProps {
  transactions: Transaction[];
  withdrawals: Withdrawal[];
}

export function TransactionHistory({ transactions, withdrawals }: TransactionHistoryProps) {
  const allHistory = [
    ...transactions.map(t => ({
      ...t,
      type: 'deposit' as const,
      title: `Setoran ${t.waste_type?.name}`,
      amount: t.total_value,
      description: `${t.weight} kg × Rp ${t.waste_type?.price_per_kg?.toLocaleString('id-ID')}/kg`
    })),
    ...withdrawals.map(w => ({
      ...w,
      type: 'withdrawal' as const,
      title: 'Penarikan Saldo',
      amount: w.amount,
      description: w.description
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-gray-900">Riwayat Transaksi</h2>
        <div className="text-sm text-gray-500">
          Total {allHistory.length} transaksi
        </div>
      </div>

      {allHistory.length === 0 ? (
        <div className="text-center py-10">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Belum ada riwayat transaksi</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allHistory.map((item) => {
            const isDeposit = item.type === 'deposit';
            const StatusIcon = !isDeposit ? getStatusIcon(item.status) : null;
            
            return (
              <div key={item.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${
                      isDeposit ? 'bg-green-100' : 'bg-blue-100'
                    }`}>
                      {isDeposit ? (
                        <Package className="w-5 h-5 text-green-600" />
                      ) : (
                        <ArrowDown className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 text-sm">{item.title}</h3>
                      <p className="text-gray-600 text-sm">{item.description}</p>
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
                    <p className={`text-lg font-bold ${
                      isDeposit ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      {isDeposit ? '+' : '-'}Rp {item.amount.toLocaleString('id-ID')}
                    </p>
                    {!isDeposit && StatusIcon && (
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
    </div>
  );
}