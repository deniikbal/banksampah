import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Leaf, User, GraduationCap, Shield } from 'lucide-react';

export function LoginPage() {
  const [nis, setNis] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const success = await login(nis, false);
      if (success) {
        navigate('/student');
      } else {
        alert('Login gagal! NIS tidak ditemukan.');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Terjadi kesalahan saat login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      {/* Green Accent */}
      <div className="absolute top-0 left-0 w-full h-1 bg-green-600"></div>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center space-x-2 mb-2">
            <div className="bg-green-600 p-2 rounded-lg">
              <Leaf className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">BankSampah</h1>
          </div>
          <p className="text-sm text-gray-600">Portal Siswa</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <div className="text-center mb-6">
            <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
              <User className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Login Siswa
            </h2>
            <p className="text-sm text-gray-600">
              Masukkan NIS untuk mengakses dashboard
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
  
            {/* NIS Field */}
            <div>
              <label htmlFor="nis" className="block text-xs font-medium text-gray-700 mb-1">
                Nomor Induk Siswa (NIS)
              </label>
              <div className="relative">
                <input
                  id="nis"
                  type="text"
                  value={nis}
                  onChange={(e) => setNis(e.target.value)}
                  placeholder="Contoh: 2024001"
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors text-gray-900 placeholder-gray-400 pl-10"
                  required
                  maxLength="20"
                />
                <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !nis.trim()}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span className="text-sm">Memproses...</span>
                </>
              ) : (
                <>
                  <span className="text-sm">Login Siswa</span>
                </>
              )}
            </button>
          </form>

          {/* Quick Links */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <Link
              to="/admin/login"
              className="text-green-600 hover:text-green-700 font-medium text-xs block text-center"
            >
              Login Admin →
            </Link>
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-700 font-medium text-xs block text-center"
            >
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>

          </div>
    </div>
  );
}