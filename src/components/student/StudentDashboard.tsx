import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { StudentProfile } from './StudentProfile';
import { TransactionHistory } from './TransactionHistory';
import { WithdrawalForm } from './WithdrawalForm';
import { supabase } from '../../lib/supabase';
import { Savings, Transaction, Withdrawal } from '../../types';
import { Wallet, History, ArrowDown, LogOut, Recycle } from 'lucide-react';

export function StudentDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [savings, setSavings] = useState<Savings | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
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
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: Wallet },
    { id: 'history', label: 'Riwayat', icon: History },
    { id: 'withdraw', label: 'Tarik Saldo', icon: ArrowDown },
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
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Recycle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bank Sampah</h1>
                <p className="text-sm text-gray-500">Portal Siswa</p>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <button
                onClick={logout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
              </button>
            </div>
            
            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
            <div className="md:hidden py-4 border-t border-gray-200">
              <button
                onClick={() => {
                  logout();
                  setIsMobileMenuOpen(false);
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Keluar
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
              <div className="flex overflow-x-auto px-4 py-2 hide-scrollbar">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex flex-col items-center justify-center min-w-[80px] py-3 px-2 font-medium text-xs transition-colors ${
                        activeTab === tab.id
                          ? 'text-green-600 border-b-2 border-green-500'
                          : 'text-gray-500'
                      }`}
                    >
                      <Icon className="w-5 h-5 mb-1" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="p-4 sm:p-6">
            {activeTab === 'profile' && (
              <StudentProfile 
                student={user!.student!} 
                savings={savings} 
                transactions={transactions}
              />
            )}
            {activeTab === 'history' && (
              <TransactionHistory 
                transactions={transactions} 
                withdrawals={withdrawals}
              />
            )}
            {activeTab === 'withdraw' && (
              <WithdrawalForm 
                studentId={user!.student!.id}
                currentBalance={savings?.balance || 0}
                onWithdrawalSubmitted={loadStudentData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}