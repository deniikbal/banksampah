import React from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/shared/Layout';

function App() {
  return (
    <AuthProvider>
      <Layout />
    </AuthProvider>
  );
}

export default App;