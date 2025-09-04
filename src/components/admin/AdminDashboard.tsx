import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { DashboardOverview } from './DashboardOverview';
import { StudentsManagement } from './StudentsManagement';
import { WasteTypesManagement } from './WasteTypesManagement';
import { TransactionsManagement } from './TransactionsManagement';
import { WithdrawalsManagement } from './WithdrawalsManagement';
import { Reports } from './Reports';
import { 
  BarChart3, 
  Users, 
  Package, 
  TrendingUp, 
  ArrowDown, 
  FileText,
  LogOut,
  Recycle,
  Menu,
  X
} from 'lucide-react';

export function AdminDashboard() {
  const { logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = [
    { id: 'overview', label: 'Dashboard', icon: BarChart3 },
    { id: 'students', label: 'Data Siswa', icon: Users },
    { id: 'waste-types', label: 'Jenis Sampah', icon: Package },
    { id: 'transactions', label: 'Transaksi', icon: TrendingUp },
    { id: 'withdrawals', label: 'Penarikan', icon: ArrowDown },
    { id: 'reports', label: 'Laporan', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header with menu button */}
      <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
        <div className="flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Recycle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Bank Sampah</h1>
              <p className="text-sm text-gray-500">Panel Admin</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
          >
            {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Desktop header */}
      <header className="bg-white shadow-sm border-b border-gray-200 hidden lg:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <Recycle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Bank Sampah</h1>
                <p className="text-sm text-gray-500">Panel Admin</p>
              </div>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Mobile sidebar - overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div 
              className="fixed inset-y-0 left-0 w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)] z-50"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-4 pt-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
                  <button 
                    onClick={() => setSidebarOpen(false)}
                    className="p-1 rounded-md text-gray-700 hover:bg-gray-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-1">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => {
                          setActiveTab(tab.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                          activeTab === tab.id
                            ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {tab.label}
                      </button>
                    );
                  })}
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg text-gray-700 hover:bg-gray-50 transition-colors mt-4"
                  >
                    <LogOut className="w-5 h-5" />
                    Keluar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Desktop sidebar */}
        <nav className="hidden lg:block w-64 bg-white shadow-sm min-h-[calc(100vh-4rem)]">
          <div className="p-4">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-green-50 text-green-700 border-l-4 border-green-500'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === 'overview' && <DashboardOverview />}
          {activeTab === 'students' && <StudentsManagement />}
          {activeTab === 'waste-types' && <WasteTypesManagement />}
          {activeTab === 'transactions' && <TransactionsManagement />}
          {activeTab === 'withdrawals' && <WithdrawalsManagement />}
          {activeTab === 'reports' && <Reports />}
        </main>
      </div>
    </div>
  );
}