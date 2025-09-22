import React from 'react';
import { Student, Savings, Transaction, WasteType, TrashbagWithdrawal } from '../../types';
import { Gift, Package, Award } from 'lucide-react';

interface StudentProfileProps {
  student: Student;
  savings: Savings | null;
  transactions: Transaction[];
  wasteTypes?: WasteType[];
  trashbagWithdrawals?: TrashbagWithdrawal[];
  totalTrashbags?: number;
}

export function StudentProfile({ student, savings, transactions, wasteTypes = [], trashbagWithdrawals = [], totalTrashbags = 0 }: StudentProfileProps) {
  
  const calculateBottleStats = () => {
    let totalBottles = 0;
    let earnedTrashbags = 0;

    transactions.forEach(transaction => {
      const wasteType = wasteTypes.find(wt => wt.id === transaction.waste_type_id);
      if (!wasteType) return;

      // Gunakan bottle_count asli jika tersedia
      let bottleCount = 0;
      let trashbagCount = 0;

      if (transaction.bottle_count && transaction.bottle_count > 0) {
        bottleCount = transaction.bottle_count;
      } else {
        // Legacy data: gunakan bottle_count yang sudah ada
        bottleCount = transaction.bottle_count || 0;
      }

      // Gunakan trashbag_reward asli jika tersedia
      if (transaction.trashbag_reward && transaction.trashbag_reward > 0) {
        trashbagCount = transaction.trashbag_reward;
      } else {
        trashbagCount = Math.floor(bottleCount / wasteType.trashbags_per_bottle);
      }

      totalBottles += bottleCount;
      earnedTrashbags += trashbagCount;
    });

    return { totalBottles, earnedTrashbags };
  };

  const { totalBottles, earnedTrashbags } = calculateBottleStats();
  const monthlyTransactions = transactions.filter(
    t => new Date(t.created_at).getMonth() === new Date().getMonth()
  ).length;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 rounded-2xl p-4 sm:p-6 text-white shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold">{student.name}</h2>
            <p className="text-emerald-100 text-xs sm:text-sm">NIS: {student.nis}</p>
            <p className="text-emerald-100 text-xs sm:text-sm">Kelas: {student.class}</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-emerald-100 text-xs font-medium">Trashbag Tersedia</p>
            <p className="text-2xl sm:text-3xl font-bold">
              {totalTrashbags} <span className="text-sm sm:text-lg font-normal">trashbag</span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-3 sm:p-5 border border-blue-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-2 sm:p-3 rounded-xl">
              <Package className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Total Botol</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-blue-600">{totalBottles.toLocaleString('id-ID')}</p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Botol yang dikumpulkan</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-3 sm:p-5 border border-purple-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 sm:p-3 rounded-xl">
              <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Total Trashbag</h3>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-purple-600">{earnedTrashbags}</p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Reward yang didapatkan</p>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-3 sm:p-5 border border-amber-100">
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
            <div className="bg-gradient-to-br from-amber-500 to-orange-500 p-2 sm:p-3 rounded-xl">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Status</h3>
          </div>
          <p className="text-base sm:text-lg font-bold text-amber-600">
            {totalBottles >= 1000 ? 'Eco Legend 🏆' :
             totalBottles >= 500 ? 'Eco Master 🌟' :
             totalBottles >= 100 ? 'Eco Hero 🌱' :
             totalBottles >= 20 ? 'Eco Friend 🌿' : 'Pemula 🌱'}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Badge lingkungan</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-2xl p-4 sm:p-6 border border-gray-200">
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
          Transaksi Terbaru
        </h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-4 sm:py-6">Belum ada transaksi</p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((transaction) => {
              const wasteType = wasteTypes.find(wt => wt.id === transaction.waste_type_id);

              // Gunakan bottle_count asli jika tersedia
              let bottleCount = 0;
              let trashbagCount = 0;

              if (transaction.bottle_count && transaction.bottle_count > 0) {
                bottleCount = transaction.bottle_count;
              } else {
                // Legacy data: gunakan bottle_count yang sudah ada
                bottleCount = transaction.bottle_count || 0;
              }

              // Gunakan trashbag_reward asli jika tersedia
              if (transaction.trashbag_reward && transaction.trashbag_reward > 0) {
                trashbagCount = transaction.trashbag_reward;
              } else {
                trashbagCount = wasteType ? Math.floor(bottleCount / wasteType.trashbags_per_bottle) : 0;
              }

              return (
                <div key={transaction.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-white to-gray-50 p-3 sm:p-4 rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <Package className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{transaction.waste_type?.name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-xs text-blue-600 font-medium">
                          {bottleCount} botol
                        </span>
                        {trashbagCount > 0 && (
                          <span className="text-xs text-purple-600 font-medium">
                            +{trashbagCount} trashbag
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {trashbagCount > 0 && (
                      <div className="flex items-center gap-1 justify-end">
                        <Gift className="w-3 h-3 text-purple-500" />
                        <span className="text-xs text-purple-600 font-medium">
                          +{trashbagCount}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}