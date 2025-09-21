import React from 'react';
import { Gift, Star, Package, TrendingUp, Award } from 'lucide-react';

interface RewardDashboardProps {
  totalTrashbags: number;
  bottleStats: {
    totalBottles: number;
    wasteBreakdown: { [key: string]: { bottles: number; trashbags: number } };
  };
}

export function RewardDashboard({ totalTrashbags, bottleStats }: RewardDashboardProps) {
  const wasteTypeIcons: { [key: string]: string } = {
    'Plastik': '🥤',
    'Kertas': '📄',
    'Kaleng': '🥫',
    'Botol Kaca': '🍾',
    'Kardus': '📦'
  };

  const wasteTypeColors: { [key: string]: string } = {
    'Plastik': 'bg-blue-100 text-blue-800',
    'Kertas': 'bg-green-100 text-green-800',
    'Kaleng': 'bg-gray-100 text-gray-800',
    'Botol Kaca': 'bg-purple-100 text-purple-800',
    'Kardus': 'bg-yellow-100 text-yellow-800'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="bg-gradient-to-br from-emerald-100 to-teal-100 p-5 rounded-full w-24 h-24 mx-auto mb-4 shadow-lg">
          <Gift className="w-14 h-14 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-3">Reward Trashbag</h2>
        <p className="text-gray-600 text-lg">Kumpulkan botol dan dapatkan trashbag sebagai reward!</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Total Trashbags */}
        <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-green-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-emerald-100 text-sm font-medium">Total Trashbag</p>
              <p className="text-4xl font-bold">{totalTrashbags}</p>
            </div>
            <Gift className="w-12 h-12 text-emerald-200" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm text-emerald-100">
              {totalTrashbags > 0 ? 'Luar biasa! Terus kumpulkan botol' : 'Mulai kumpulkan botol untuk mendapatkan reward'}
            </span>
          </div>
        </div>

        {/* Total Bottles */}
        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-teal-100 text-sm font-medium">Total Botol</p>
              <p className="text-4xl font-bold">{bottleStats.totalBottles.toLocaleString('id-ID')}</p>
            </div>
            <Package className="w-12 h-12 text-teal-200" />
          </div>
          <div className="mt-4 flex items-center gap-2">
            <Star className="w-4 h-4" />
            <span className="text-sm text-teal-100">
              Setiap botol berkontribusi untuk lingkungan yang lebih bersih
            </span>
          </div>
        </div>
      </div>

      {/* Waste Type Breakdown */}
      <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Package className="w-5 h-5 text-emerald-600" />
          Breakdown per Jenis Sampah
        </h3>
        {Object.keys(bottleStats.wasteBreakdown).length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Belum ada data pengumpulan sampah</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(bottleStats.wasteBreakdown).map(([wasteType, stats]) => (
              <div key={wasteType} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-all duration-200">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{wasteTypeIcons[wasteType] || '🗑️'}</span>
                  <div>
                    <p className="font-medium text-gray-900">{wasteType}</p>
                    <p className="text-sm text-gray-500">
                      {stats.bottles.toLocaleString('id-ID')} botol
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${wasteTypeColors[wasteType] || 'bg-gray-100 text-gray-800'}`}>
                    <Gift className="w-4 h-4" />
                    {stats.trashbags} trashbag
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Motivational Message */}
      <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-200 shadow-lg">
        <div className="flex items-center gap-3 mb-3">
          <Award className="w-6 h-6 text-emerald-600" />
          <h3 className="text-lg font-semibold text-emerald-800">Tetap Semangat!</h3>
        </div>
        <p className="text-emerald-700 leading-relaxed">
          Setiap botol yang kamu kumpulkan membantu menjaga kebersihan lingkungan dan
          memberikan reward trashbag yang berguna. Terus kumpulkan botol untuk mendapatkan lebih banyak reward!
        </p>
      </div>
    </div>
  );
}