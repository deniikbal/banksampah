import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/login/LoginPage';
import { AdminLoginPage } from './components/admin/login/AdminLoginPage';
import { ProtectedLayout } from './components/shared/ProtectedLayout';
import { NotFoundPage } from './components/shared/NotFoundPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/student/*" element={<ProtectedLayout />} />
        <Route path="/admin/*" element={<ProtectedLayout />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;