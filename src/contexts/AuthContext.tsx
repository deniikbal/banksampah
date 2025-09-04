import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Student, User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (nis: string, isAdmin?: boolean) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('wastebank_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (nis: string, isAdmin: boolean = false): Promise<boolean> => {
    try {
      if (isAdmin) {
        // Simple admin login - in production, use proper authentication
        if (nis === 'admin123') {
          const adminUser: User = { role: 'admin' };
          setUser(adminUser);
          localStorage.setItem('wastebank_user', JSON.stringify(adminUser));
          return true;
        }
        return false;
      }

      const { data: student, error } = await supabase
        .from('students')
        .select('*')
        .eq('nis', nis)
        .single();

      if (error || !student) {
        return false;
      }

      const studentUser: User = { role: 'student', student };
      setUser(studentUser);
      localStorage.setItem('wastebank_user', JSON.stringify(studentUser));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('wastebank_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}