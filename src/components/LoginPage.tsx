import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Recycle, User, Shield } from 'lucide-react';
import toast from 'react-hot-toast';

export function LoginPage() {
  const [nis, setNis] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nis.trim()) {
      toast.error('Masukkan NIS atau kode admin');
      return;
    }

    setLoading(true);
    const success = await login(nis.trim(), isAdmin);
    setLoading(false);

    if (success) {
      toast.success(`Login berhasil sebagai ${isAdmin ? 'admin' : 'siswa'}`);
    } else {
      toast.error('NIS tidak ditemukan atau kode admin salah');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 p-4 rounded-full">
              <Recycle className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Bank Sampah</h1>
          <p className="text-gray-600">Sekolah Ramah Lingkungan</p>
        </div>

        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setIsAdmin(false)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
              !isAdmin 
                ? 'bg-white shadow-sm text-green-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <User className="w-4 h-4" />
            Siswa
          </button>
          <button
            type="button"
            onClick={() => setIsAdmin(true)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md transition-all ${
              isAdmin 
                ? 'bg-white shadow-sm text-green-600' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nis" className="block text-sm font-medium text-gray-700 mb-2">
              {isAdmin ? 'Kode Admin' : 'Nomor Induk Siswa (NIS)'}
            </label>
            <input
              type="text"
              id="nis"
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              placeholder={isAdmin ? 'Masukkan kode admin' : 'Masukkan NIS Anda'}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {loading ? 'Sedang login...' : 'Login'}
          </button>
        </form>

        {!isAdmin && (
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-700">
              <strong>Demo NIS:</strong> 12345, 12346, 12347, 12348, 12349
            </p>
          </div>
        )}

        {isAdmin && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Demo Admin:</strong> admin123
            </p>
          </div>
        )}
      </div>
    </div>
  );
}