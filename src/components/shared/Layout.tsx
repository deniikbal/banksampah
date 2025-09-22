import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LoginPage } from '../LoginPage';
import { StudentDashboard } from '../student/StudentDashboard';
import { AdminDashboard } from '../admin/AdminDashboard';
import { Toaster } from 'react-hot-toast';

export function Layout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat aplikasi...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {!user ? (
        <LoginPage />
      ) : user.role === 'student' ? (
        <StudentDashboard />
      ) : (
        <AdminDashboard />
      )}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}