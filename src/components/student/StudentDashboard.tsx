import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StudentProfile } from './StudentProfile';
import { RewardDashboard } from './RewardDashboard';
import { TransactionHistory } from './TransactionHistory';
import { TrashbagWithdrawalForm } from './TrashbagWithdrawalForm';
import { supabase } from '../../lib/supabase';
import { Savings, Transaction, WasteType, TrashbagWithdrawal } from '../../types';
import { Wallet, History, LogOut, Recycle, Gift, Star, ShoppingBag } from 'lucide-react';

export function StudentDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [savings, setSavings] = useState<Savings | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [wasteTypes, setWasteTypes] = useState<WasteType[]>([]);
  const [totalTrashbags, setTotalTrashbags] = useState(0);
  const [bottleStats, setBottleStats] = useState<{
    totalBottles: number;
    wasteBreakdown: { [key: string]: { bottles: number; trashbags: number } };
  }>({ totalBottles: 0, wasteBreakdown: {} });
  const [trashbagWithdrawals, setTrashbagWithdrawals] = useState<TrashbagWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.student) {
      loadStudentData();
    }
  }, [user]);

  const loadStudentData = async () => {
    if (!user?.student) return;

    try {
      // Load savings
      const { data: savingsData } = await supabase
        .from('savings')
        .select('*')
        .eq('student_id', user.student.id)
        .single();

      setSavings(savingsData);

      // Load waste types
      const { data: wasteTypesData } = await supabase
        .from('waste_types')
        .select('*')
        .order('name');

      setWasteTypes(wasteTypesData || []);

      // Load transactions with waste type info
      const { data: transactionsData } = await supabase
        .from('transactions')
        .select(`
          *,
          waste_type:waste_types(*)
        `)
        .eq('student_id', user.student.id)
        .order('created_at', { ascending: false });

      setTransactions(transactionsData || []);

      // Load withdrawals
      const { data: withdrawalsData } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('student_id', user.student.id)
        .order('created_at', { ascending: false });

      setWithdrawals(withdrawalsData || []);

      // Load trashbag withdrawals
      const { data: trashbagWithdrawalsData } = await supabase
        .from('trashbag_withdrawals')
        .select('*')
        .eq('student_id', user.student.id)
        .order('created_at', { ascending: false });

      setTrashbagWithdrawals(trashbagWithdrawalsData || []);

      // Calculate bottle and trashbag statistics
      if (transactionsData && wasteTypesData) {
        calculateBottleStats(transactionsData, wasteTypesData, trashbagWithdrawalsData || []);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateBottleStats = (transactions: Transaction[], wasteTypes: WasteType[], trashbagWithdrawals: TrashbagWithdrawal[] = []) => {
    let totalBottles = 0;
    let totalTrashbags = 0;
    const wasteBreakdown: { [key: string]: { bottles: number; trashbags: number } } = {};

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

      // Gunakan trashbag_reward asli jika tersedia, fallback ke perhitungan
      if (transaction.trashbag_reward && transaction.trashbag_reward > 0) {
        trashbagCount = transaction.trashbag_reward;
      } else {
        trashbagCount = Math.floor(bottleCount / wasteType.trashbags_per_bottle);
      }

      totalBottles += bottleCount;
      totalTrashbags += trashbagCount;

      if (!wasteBreakdown[wasteType.name]) {
        wasteBreakdown[wasteType.name] = { bottles: 0, trashbags: 0 };
      }
      wasteBreakdown[wasteType.name].bottles += bottleCount;
      wasteBreakdown[wasteType.name].trashbags += trashbagCount;
    });

    // Kurangi total trashbags dengan yang sudah disetujui ditarik
    const approvedWithdrawals = trashbagWithdrawals.filter(w => w.status === 'approved');
    const withdrawnTrashbags = approvedWithdrawals.reduce((sum, w) => sum + w.amount, 0);
    const availableTrashbags = totalTrashbags - withdrawnTrashbags;

    setTotalTrashbags(availableTrashbags);
    setBottleStats({ totalBottles, wasteBreakdown });
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: Wallet },
    { id: 'rewards', label: 'Reward', icon: Gift },
    { id: 'history', label: 'Riwayat', icon: History },
    { id: 'trashbag-withdrawal', label: 'Penarikan Trashbag', icon: ShoppingBag },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <header className="bg-gradient-to-r from-emerald-600 to-teal-600 shadow-lg border-b border-emerald-700">
        <div className="px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-2 sm:p-3 rounded-xl">
                <Recycle className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 text-white" />
              </div>
              <div>
                <h1 className="text-base sm:text-lg md:text-xl font-bold text-white">Bank Sampah</h1>
                <p className="text-xs text-emerald-100 hidden sm:block">Portal Siswa</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-white hover:text-emerald-100 hover:bg-white/10 rounded-lg transition-all duration-200 backdrop-blur-sm"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-1.5 sm:p-2 rounded-md text-white hover:text-emerald-100 hover:bg-white/10 focus:outline-none transition-all duration-200"
              >
                <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isMobileMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden py-3 sm:py-4 border-t border-emerald-500/30 bg-white/10 backdrop-blur-sm">
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full px-3 sm:px-4 py-2.5 text-white hover:text-emerald-100 hover:bg-white/10 rounded-lg transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm">Keluar</span>
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm">
          <div className="border-b border-gray-200">
            {/* Desktop Tabs */}
            <nav className="hidden md:flex space-x-8 px-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-green-500 text-green-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
            
            {/* Mobile Tabs */}
            <div className="md:hidden">
              <div className="flex overflow-x-auto px-2 py-1.5 sm:py-2 hide-scrollbar">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center justify-center min-w-[60px] sm:min-w-[70px] py-1.5 sm:py-2 px-1 sm:px-2 font-medium text-xs transition-all duration-200 flex-shrink-0 ${
                        activeTab === tab.id
                          ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50'
                          : 'text-gray-600 hover:text-emerald-500 hover:bg-emerald-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 mb-0.5 sm:mb-1" />
                      <span className="text-center leading-tight text-[10px] sm:text-xs">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-3 sm:p-6 bg-white/80 backdrop-blur-sm rounded-t-3xl shadow-lg min-h-[calc(100vh-8rem)]">
            {activeTab === 'profile' && (
              <StudentProfile
                student={user!.student!}
                savings={savings}
                transactions={transactions}
                wasteTypes={wasteTypes}
                trashbagWithdrawals={trashbagWithdrawals}
                totalTrashbags={totalTrashbags}
              />
            )}
            {activeTab === 'rewards' && (
              <RewardDashboard
                totalTrashbags={totalTrashbags}
                bottleStats={bottleStats}
              />
            )}
            {activeTab === 'history' && (
              <TransactionHistory
                transactions={transactions}
                withdrawals={withdrawals}
                trashbagWithdrawals={trashbagWithdrawals}
                wasteTypes={wasteTypes}
              />
            )}
            {activeTab === 'trashbag-withdrawal' && (
              <TrashbagWithdrawalForm
                studentId={user!.student!.id}
                availableTrashbags={totalTrashbags}
                totalBottles={bottleStats.totalBottles}
                onWithdrawalSubmitted={loadStudentData}
              />
            )}
                      </div>
        </div>
      </div>
    </div>
  );
}