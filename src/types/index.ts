export interface Student {
  id: string;
  nis: string;
  name: string;
  class: string;
  created_at: string;
}

export interface WasteType {
  id: string;
  name: string;
  trashbags_per_bottle: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  student_id: string;
  waste_type_id: string;
  weight: number;
  total_value: number;
  created_at: string;
  student?: Student;
  waste_type?: WasteType;
}

export interface Savings {
  id: string;
  student_id: string;
  balance: number;
  updated_at: string;
  student?: Student;
}

export interface Withdrawal {
  id: string;
  student_id: string;
  amount: number;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  student?: Student;
}

export interface User {
  role: 'student' | 'admin';
  student?: Student;
}

export interface DashboardStats {
  totalStudents: number;
  totalWasteCollected: number;
  totalSavings: number;
  pendingWithdrawals: number;
  wasteByType: Array<{
    name: string;
    weight: number;
    value: number;
  }>;
  monthlyData: Array<{
    month: string;
    weight: number;
    value: number;
  }>;
  topStudents: Array<{
    student: Student;
    totalTransactions: number;
    totalWeight: number;
  }>;
}

export interface Class {
  id: string;
  name: string;
  teacher: string;
  created_at: string;
  updated_at: string;
}