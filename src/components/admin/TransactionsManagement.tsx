import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Transaction, Student, WasteType } from '../../types';
import { Plus, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { TransactionForm } from './TransactionForm';
import toast from 'react-hot-toast';
import { ConfirmDialog } from '../ui/ConfirmDialog';

export function TransactionsManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [transactionsPerPage, setTransactionsPerPage] = useState(10);

  // Berat per botol untuk setiap jenis sampah (dalam kg)
  const BOTTLE_WEIGHTS: { [key: string]: number } = {
    'Plastik': 0.05,    // 50 gram per botol plastik
    'Kertas': 0.02,     // 20 gram per botol kertas
    'Kaleng': 0.1,      // 100 gram per botol kaleng
    'Botol Kaca': 0.3,  // 300 gram per botol kaca
    'Kardus': 0.05      // 50 gram per botol kardus
  };

  // Fungsi untuk mendapatkan jumlah botol (prioritas data asli, fallback ke konversi untuk legacy data)
  const getBottleCount = (transaction: Transaction) => {
    // Gunakan bottle_count asli jika tersedia
    if (transaction.bottle_count && transaction.bottle_count > 0) {
      return transaction.bottle_count;
    }

    // Fallback: gunakan bottle_count yang sudah ada atau 0
    return transaction.bottle_count || 0;
  };

  // Fungsi untuk mendapatkan trashbag reward (prioritas data asli, fallback ke perhitungan untuk legacy data)
  const getTrashbagReward = (transaction: Transaction) => {
    // Gunakan trashbag_reward asli jika tersedia
    if (transaction.trashbag_reward && transaction.trashbag_reward > 0) {
      return transaction.trashbag_reward;
    }

    // Fallback: hitung dari bottle_count untuk legacy data
    if (!transaction.waste_type) return 0;

    const bottleCount = getBottleCount(transaction);
    const trashbagsPerBottle = transaction.waste_type.trashbags_per_bottle || 20;
    return Math.floor(bottleCount / trashbagsPerBottle);
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          student:students(*),
          waste_type:waste_types(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Gagal memuat data transaksi');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleDelete = (transaction: Transaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!transactionToDelete) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', transactionToDelete.id);

      if (error) throw error;

      toast.success('Transaksi berhasil dihapus');
      setShowDeleteConfirm(false);
      setTransactionToDelete(null);
      loadTransactions();
    } catch (error) {
      console.error('Error deleting transaction:', error);
      toast.error('Gagal menghapus transaksi');
    } finally {
      setDeleting(false);
    }
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setTransactionToDelete(null);
  };

  // Pagination logic
  const totalPages = Math.ceil(transactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const paginatedTransactions = transactions.slice(startIndex, startIndex + transactionsPerPage);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top when changing pages
    const tableElement = document.querySelector('.bg-white.rounded-xl.shadow-sm');
    if (tableElement) {
      tableElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleTransactionsPerPageChange = (value: number) => {
    setTransactionsPerPage(value);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  // Mobile card component
  const TransactionCard = ({ transaction }: { transaction: Transaction }) => (
    <div className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex justify-between">
            <p className="text-xs text-gray-500">
              {new Date(transaction.created_at).toLocaleDateString('id-ID')}
            </p>
            <p className="text-sm font-semibold text-green-600">
              {getTrashbagReward(transaction)} 🎁
            </p>
          </div>
          <h3 className="font-semibold text-gray-900 mt-1">{transaction.student?.name}</h3>
          <p className="text-sm text-gray-600">{transaction.student?.class}</p>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-gray-600">{transaction.waste_type?.name}</span>
            <span className="text-sm font-medium text-gray-900">{getBottleCount(transaction)} botol</span>
          </div>
        </div>
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => handleEdit(transaction)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDelete(transaction)}
            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  // Pagination component
  const Pagination = () => {
    if (totalPages <= 1 && transactions.length <= transactionsPerPage) return null;

    const getPageNumbers = () => {
      const pages = [];
      const maxVisiblePages = 5;

      if (totalPages <= maxVisiblePages) {
        for (let i = 1; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Always show first page
        pages.push(1);

        // Show ellipsis if needed
        if (currentPage > 3) {
          pages.push('ellipsis-start');
        }

        // Show pages around current page
        for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
          pages.push(i);
        }

        // Show ellipsis if needed
        if (currentPage < totalPages - 2) {
          pages.push('ellipsis-end');
        }

        // Always show last page
        if (totalPages > 1) {
          pages.push(totalPages);
        }
      }

      return pages;
    };

    // Mobile pagination component
    const MobilePagination = () => (
      <div className="flex flex-col sm:hidden gap-3 border-t border-gray-200 px-4 py-3">
        <div className="text-sm text-gray-700 text-center">
          Menampilkan {startIndex + 1}-{Math.min(startIndex + transactionsPerPage, transactions.length)} dari {transactions.length} transaksi
        </div>
        <div className="flex items-center justify-center gap-2">
          <label htmlFor="mobile-transactions-per-page" className="text-sm text-gray-600">
            Tampilkan:
          </label>
          <select
            id="mobile-transactions-per-page"
            value={transactionsPerPage}
            onChange={(e) => handleTransactionsPerPageChange(Number(e.target.value))}
            className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
        <div className="flex items-center justify-between">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex-1 mr-2"
          >
            Sebelumnya
          </button>
          <div className="text-sm text-gray-600">
            Hal {currentPage} dari {totalPages}
          </div>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex-1 ml-2"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    );

    // Desktop pagination component
    const DesktopPagination = () => (
      <div className="hidden sm:flex items-center justify-between border-t border-gray-200 px-4 py-3">
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-700">
            Menampilkan {startIndex + 1} sampai {Math.min(startIndex + transactionsPerPage, transactions.length)} dari {transactions.length} transaksi
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="transactions-per-page" className="text-sm text-gray-600">
              Tampilkan:
            </label>
            <select
              id="transactions-per-page"
              value={transactionsPerPage}
              onChange={(e) => handleTransactionsPerPageChange(Number(e.target.value))}
              className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>
        <div className="flex items-center space-x-1">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-3 py-1 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Sebelumnya
          </button>

          {getPageNumbers().map((page, index) => {
            if (page === 'ellipsis-start' || page === 'ellipsis-end') {
              return (
                <span key={index} className="px-2 py-1 text-sm text-gray-500">
                  ...
                </span>
              );
            }

            return (
              <button
                key={index}
                onClick={() => handlePageChange(page as number)}
                className={`px-3 py-1 rounded-md text-sm font-medium ${
                  currentPage === page
                    ? 'bg-green-600 text-white'
                    : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                {page}
              </button>
            );
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-3 py-1 rounded-md text-sm font-medium text-gray-500 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    );

    return (
      <>
        <MobilePagination />
        <DesktopPagination />
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Transaksi Setoran</h1>
          <p className="text-gray-600">Kelola setoran sampah siswa</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Input Setoran
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-900">Riwayat Transaksi</h3>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">Tanggal</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">Siswa</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-900">Jenis Sampah</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-900">Jumlah Botol</th>
                <th className="text-right py-3 px-4 text-xs font-semibold text-gray-900">Reward</th>
                <th className="text-center py-3 px-4 text-xs font-semibold text-gray-900">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm text-gray-900">
                    {new Date(transaction.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{transaction.student?.name}</p>
                      <p className="text-xs text-gray-600">{transaction.student?.class}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900">{transaction.waste_type?.name}</td>
                  <td className="py-3 px-4 text-right font-medium text-gray-900 text-sm">
                    {getBottleCount(transaction)} botol
                  </td>
                  <td className="py-3 px-4 text-right font-medium text-green-600 text-sm">
                    {getTrashbagReward(transaction)} 🎁
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-center gap-1">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden">
          <div className="space-y-4 p-4">
            {paginatedTransactions.map((transaction) => (
              <TransactionCard key={transaction.id} transaction={transaction} />
            ))}
          </div>
        </div>

        {transactions.length === 0 && (
          <div className="text-center py-10">
            <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Belum ada transaksi</p>
          </div>
        )}

        {/* Pagination for both views */}
        <Pagination />
      </div>

      {showForm && (
        <TransactionForm
          transactionData={editingTransaction}
          onClose={() => {
            setShowForm(false);
            setEditingTransaction(null);
          }}
          onSubmit={() => {
            setShowForm(false);
            setEditingTransaction(null);
            loadTransactions();
          }}
        />
      )}

      {showDeleteConfirm && transactionToDelete && (
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          title="Hapus Transaksi"
          message={`Apakah Anda yakin ingin menghapus transaksi ${transactionToDelete.student?.name} pada tanggal ${new Date(transactionToDelete.created_at).toLocaleDateString('id-ID')}? Tindakan ini tidak dapat dibatalkan.`}
          confirmText="Hapus"
          cancelText="Batal"
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
          loading={deleting}
          type="danger"
        />
      )}
    </div>
  );
}