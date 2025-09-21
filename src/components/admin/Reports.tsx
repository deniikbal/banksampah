import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';

export function Reports() {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadReportData();
  }, [dateRange]);

  const loadReportData = async () => {
    try {
      const startDate = new Date(dateRange.startDate);
      const endDate = new Date(dateRange.endDate);
      endDate.setHours(23, 59, 59, 999);

      // Get transactions in date range
      const { data: transactions, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          student:students(*),
          waste_type:waste_types(*)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;

      // Get all students with their savings
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          savings(balance)
        `);

      if (studentsError) throw studentsError;

      // Calculate statistics
      const totalBottles = transactions?.reduce((sum, t) => sum + (t.bottle_count || 0), 0) || 0;
      const totalSavings = students?.reduce((sum, s) => sum + (s.savings?.[0]?.balance || 0), 0) || 0;

      // Group by waste type
      const wasteStats = transactions?.reduce((acc, t) => {
        const typeName = t.waste_type?.name || 'Unknown';
        if (!acc[typeName]) {
          acc[typeName] = { name: typeName, bottleCount: 0, count: 0 };
        }
        acc[typeName].bottleCount += t.bottle_count || 0;
        acc[typeName].count += 1;
        return acc;
      }, {} as Record<string, any>) || {};

      // Top students
      const studentStats = transactions?.reduce((acc, t) => {
        const studentId = t.student_id;
        if (!acc[studentId]) {
          acc[studentId] = {
            student: t.student,
            totalBottles: 0,
            transactionCount: 0
          };
        }
        acc[studentId].totalBottles += t.bottle_count || 0;
        acc[studentId].transactionCount += 1;
        return acc;
      }, {} as Record<string, any>) || {};

      setReportData({
        transactions: transactions || [],
        students: students || [],
        summary: {
          totalBottles,
          totalSavings,
          transactionCount: transactions?.length || 0,
          studentCount: students?.length || 0
        },
        wasteStats: Object.values(wasteStats),
        topStudents: Object.values(studentStats).sort((a: any, b: any) => b.totalBottles - a.totalBottles).slice(0, 10)
      });
    } catch (error) {
      console.error('Error loading report data:', error);
      toast.error('Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const wb = XLSX.utils.book_new();

    // Summary sheet
    const summaryData = [
      ['Laporan Bank Sampah Sekolah'],
      ['Periode:', `${dateRange.startDate} s/d ${dateRange.endDate}`],
      [''],
      ['RINGKASAN'],
      ['Total Siswa', reportData.summary.studentCount],
      ['Total Transaksi', reportData.summary.transactionCount],
      ['Total Botol', `${reportData.summary.totalBottles} botol`],
      ['Total Saldo Siswa', `Rp ${reportData.summary.totalSavings.toLocaleString('id-ID')}`]
    ];

    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Ringkasan');

    // Transactions sheet
    const transactionsData = [
      ['Tanggal', 'Siswa', 'Kelas', 'Jenis Sampah', 'Jumlah Botol', 'Trashbag Reward'],
      ...reportData.transactions.map((t: any) => [
        new Date(t.created_at).toLocaleDateString('id-ID'),
        t.student?.name || '',
        t.student?.class || '',
        t.waste_type?.name || '',
        t.bottle_count || 0,
        t.trashbag_reward || 0
      ])
    ];

    const transactionsWs = XLSX.utils.aoa_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(wb, transactionsWs, 'Transaksi');

    // Save file
    XLSX.writeFile(wb, `laporan-bank-sampah-${dateRange.startDate}-${dateRange.endDate}.xlsx`);
    toast.success('Laporan Excel berhasil diunduh');
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const pdf = new jsPDF();
    
    // Header
    pdf.setFontSize(16);
    pdf.text('LAPORAN BANK SAMPAH SEKOLAH', 20, 20);
    
    pdf.setFontSize(12);
    pdf.text(`Periode: ${dateRange.startDate} s/d ${dateRange.endDate}`, 20, 35);
    
    // Summary
    let y = 55;
    pdf.setFontSize(14);
    pdf.text('RINGKASAN', 20, y);
    
    y += 15;
    pdf.setFontSize(11);
    pdf.text(`Total Siswa: ${reportData.summary.studentCount}`, 20, y);
    y += 10;
    pdf.text(`Total Transaksi: ${reportData.summary.transactionCount}`, 20, y);
    y += 10;
    pdf.text(`Total Botol: ${reportData.summary.totalBottles} botol`, 20, y);
    y += 10;
    pdf.text(`Total Saldo Siswa: Rp ${reportData.summary.totalSavings.toLocaleString('id-ID')}`, 20, y);

    // Top Students
    y += 25;
    pdf.setFontSize(14);
    pdf.text('SISWA TERAKTIF', 20, y);
    
    y += 15;
    pdf.setFontSize(11);
    reportData.topStudents.slice(0, 5).forEach((student: any, index: number) => {
      pdf.text(`${index + 1}. ${student.student?.name} - ${student.totalBottles} botol`, 20, y);
      y += 10;
    });

    pdf.save(`laporan-bank-sampah-${dateRange.startDate}-${dateRange.endDate}.pdf`);
    toast.success('Laporan PDF berhasil diunduh');
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
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
        <p className="text-gray-600 text-sm">Ekspor dan analisis data Bank Sampah</p>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Calendar className="w-4 h-4 text-gray-600" />
          <h3 className="text-base font-semibold text-gray-900">Filter Periode</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Tanggal Selesai
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToExcel}
              className="flex items-center gap-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
            >
              <Download className="w-3 h-3" />
              Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center gap-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
            >
              <Download className="w-3 h-3" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="text-xs text-gray-600 mb-1">Total Transaksi</h3>
          <p className="text-xl font-bold text-gray-900">{reportData?.summary.transactionCount || 0}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="text-xs text-gray-600 mb-1">Total Botol</h3>
          <p className="text-xl font-bold text-green-600">{reportData?.summary.totalBottles || 0} botol</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="text-xs text-gray-600 mb-1">Total Nilai</h3>
          <p className="text-xl font-bold text-blue-600">
            Rp {reportData?.summary.totalValue.toLocaleString('id-ID') || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="text-xs text-gray-600 mb-1">Total Saldo</h3>
          <p className="text-xl font-bold text-purple-600">
            Rp {reportData?.summary.totalSavings.toLocaleString('id-ID') || 0}
          </p>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Statistik per Jenis Sampah</h3>
          <div className="space-y-2">
            {reportData?.wasteStats.map((waste: any) => (
              <div key={waste.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{waste.name}</p>
                  <p className="text-xs text-gray-600">{waste.count} transaksi</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-sm">{waste.bottleCount} botol</p>
                  <p className="text-xs text-gray-600">
                    {waste.count} transaksi
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Siswa Teraktif</h3>
          <div className="space-y-2">
            {reportData?.topStudents.slice(0, 5).map((student: any, index: number) => (
              <div key={student.student?.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-green-100 text-green-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{student.student?.name}</p>
                    <p className="text-xs text-gray-600">{student.student?.class}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 text-sm">{student.totalBottles} botol</p>
                  <p className="text-xs text-gray-600">{student.transactionCount} transaksi</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}