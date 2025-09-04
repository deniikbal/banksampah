import React from 'react';
import { Student, Savings, Transaction } from '../../types';
import { Wallet, TrendingUp, Calendar, Award } from 'lucide-react';

interface StudentProfileProps {
  student: Student;
  savings: Savings | null;
  transactions: Transaction[];
}

export function StudentProfile({ student, savings, transactions }: StudentProfileProps) {
  const totalWeight = transactions.reduce((sum, t) => sum + t.weight, 0);
  const monthlyTransactions = transactions.filter(
    t => new Date(t.created_at).getMonth() === new Date().getMonth()
  ).length;

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-4 text-white">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">{student.name}</h2>
            <p className="text-green-100 text-sm">NIS: {student.nis}</p>
            <p className="text-green-100 text-sm">Kelas: {student.class}</p>
          </div>
          <div className="text-right">
            <p className="text-green-100 text-xs">Saldo Saat Ini</p>
            <p className="text-2xl font-bold">
              Rp {(savings?.balance || 0).toLocaleString('id-ID')}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-blue-100 p-2 rounded-lg">
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Total Sampah</h3>
          </div>
          <p className="text-xl font-bold text-blue-600">{totalWeight.toFixed(1)} kg</p>
          <p className="text-xs text-gray-600">Sampah yang telah disetor</p>
        </div>

        <div className="bg-purple-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Calendar className="w-4 h-4 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Bulan Ini</h3>
          </div>
          <p className="text-xl font-bold text-purple-600">{monthlyTransactions}</p>
          <p className="text-xs text-gray-600">Transaksi setoran</p>
        </div>

        <div className="bg-orange-50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Award className="w-4 h-4 text-orange-600" />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">Status</h3>
          </div>
          <p className="text-base font-bold text-orange-600">
            {totalWeight > 50 ? 'Eco Warrior 🏆' : 
             totalWeight > 20 ? 'Eco Hero 🌟' : 
             totalWeight > 5 ? 'Eco Friend 🌱' : 'Pemula 🌿'}
          </p>
          <p className="text-xs text-gray-600">Badge lingkungan</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-3">Transaksi Terbaru</h3>
        {transactions.length === 0 ? (
          <p className="text-gray-500 text-center py-6">Belum ada transaksi</p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex justify-between items-center bg-white p-3 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{transaction.waste_type?.name}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-sm">
                    Rp {transaction.total_value.toLocaleString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-500">{transaction.weight} kg</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}