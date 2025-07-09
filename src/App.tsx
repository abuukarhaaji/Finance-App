import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { DarkModeProvider } from './contexts/DarkModeContext';
import { FinanceProvider } from './contexts/FinanceContext';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';
import { Header } from './components/Layout/Header';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';

function App() {
  return (
    <AuthProvider>
      <DarkModeProvider>
        <FinanceProvider>
          <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
              <ProtectedRoute>
                <Header />
                <main>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                  </Routes>
                </main>
              </ProtectedRoute>
              <Toaster 
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                  },
                }}
              />
            </div>
          </Router>
        </FinanceProvider>
      </DarkModeProvider>
    </AuthProvider>
  );
}

export default App;