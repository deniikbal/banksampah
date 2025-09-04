import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { DashboardStats } from '../../types';
import { 
  Users, 
  Package, 
  Wallet, 
  Clock,
  TrendingUp,
  Award
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      // Get basic counts
      const [studentsRes, transactionsRes, savingsRes, withdrawalsRes] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact' }),
        supabase.from('transactions').select(`
          *,
          waste_type:waste_types(*)
        `),
        supabase.from('savings').select('balance'),
        supabase.from('withdrawals').select('*').eq('status', 'pending')
      ]);

      const totalStudents = studentsRes.count || 0;
      const transactions = transactionsRes.data || [];
      const totalWasteCollected = transactions.reduce((sum, t) => sum + t.weight, 0);
      const totalSavings = savingsRes.data?.reduce((sum, s) => sum + s.balance, 0) || 0;
      const pendingWithdrawals = withdrawalsRes.count || 0;

      // Group by waste type
      const wasteByType = transactions.reduce((acc, t) => {
        const typeName = t.waste_type?.name || 'Unknown';
        if (!acc[typeName]) {
          acc[typeName] = { name: typeName, weight: 0, value: 0 };
        }
        acc[typeName].weight += t.weight;
        acc[typeName].value += t.total_value;
        return acc;
      }, {} as Record<string, { name: string; weight: number; value: number }>);

      // Monthly data for the last 6 months
      const monthlyData = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.created_at);
          return transactionDate.getMonth() === date.getMonth() && 
                 transactionDate.getFullYear() === date.getFullYear();
        });
        
        monthlyData.push({
          month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          weight: monthTransactions.reduce((sum, t) => sum + t.weight, 0),
          value: monthTransactions.reduce((sum, t) => sum + t.total_value, 0)
        });
      }

      // Top students
      const studentStats = transactions.reduce((acc, t) => {
        if (!acc[t.student_id]) {
          acc[t.student_id] = { totalTransactions: 0, totalWeight: 0 };
        }
        acc[t.student_id].totalTransactions += 1;
        acc[t.student_id].totalWeight += t.weight;
        return acc;
      }, {} as Record<string, { totalTransactions: number; totalWeight: number }>);

      const { data: studentsData } = await supabase
        .from('students')
        .select('*');

      const topStudents = Object.entries(studentStats)
        .map(([studentId, stats]) => ({
          student: studentsData?.find(s => s.id === studentId),
          ...stats
        }))
        .filter(s => s.student)
        .sort((a, b) => b.totalWeight - a.totalWeight)
        .slice(0, 5);

      setStats({
        totalStudents,
        totalWasteCollected,
        totalSavings,
        pendingWithdrawals,
        wasteByType: Object.values(wasteByType),
        monthlyData,
        topStudents
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
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

  if (!stats) return null;

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Dashboard Admin</h1>
        <p className="text-gray-600 text-sm">Ringkasan aktivitas Bank Sampah Sekolah</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Siswa</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Sampah Terkumpul</p>
              <p className="text-xl font-bold text-gray-900">{stats.totalWasteCollected.toFixed(1)} kg</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-2 rounded-lg">
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Total Saldo</p>
              <p className="text-xl font-bold text-gray-900">
                Rp {stats.totalSavings.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-600">Penarikan Pending</p>
              <p className="text-xl font-bold text-gray-900">{stats.pendingWithdrawals}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Sampah per Bulan</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={stats.monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  name === 'weight' ? `${value} kg` : `Rp ${Number(value).toLocaleString('id-ID')}`,
                  name === 'weight' ? 'Berat' : 'Nilai'
                ]}
              />
              <Bar dataKey="weight" fill="#10B981" name="weight" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Jenis Sampah</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={stats.wasteByType}
                cx="50%"
                cy="50%"
                outerRadius={60}
                dataKey="weight"
                label={({ name, weight }) => `${name}: ${weight.toFixed(1)}kg`}
              >
                {stats.wasteByType.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value} kg`, 'Berat']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Students */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Award className="w-4 h-4 text-yellow-500" />
          Siswa Teraktif
        </h3>
        {stats.topStudents.length === 0 ? (
          <p className="text-gray-500 text-center py-6">Belum ada data transaksi</p>
        ) : (
          <div className="space-y-3">
            {stats.topStudents.map((student, index) => (
              <div key={student.student.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-700' :
                    index === 1 ? 'bg-gray-100 text-gray-700' :
                    index === 2 ? 'bg-orange-100 text-orange-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{student.student.name}</p>
                    <p className="text-xs text-gray-600">{student.student.class}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{student.totalWeight.toFixed(1)} kg</p>
                  <p className="text-xs text-gray-600">{student.totalTransactions} transaksi</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}