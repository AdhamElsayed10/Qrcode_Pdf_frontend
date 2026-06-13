import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import DashboardLayout from './layouts/DashboardLayout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import UploadPage from './pages/UploadPage';
import DocumentsPage from './pages/DocumentsPage';
import SettingsPage from './pages/SettingsPage';

function ProtectedRoute({ children }) {
  const { admin, loading } = useAuth();

  // Wait for auth state to settle before making navigation decisions
  if (loading) {
    return (
      <div className="min-h-screen bg-surface-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Auth confirmed as empty — redirect to login
  if (!admin) {
    return <Navigate to="/login" replace />;
  }

  // Authenticated — render children
  return children;
}

function PublicRoute({ children }) {
  const { admin, loading } = useAuth();

  // Wait for auth state to settle
  if (loading) return null;

  // Already authenticated — redirect to dashboard
  if (admin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Not authenticated — show public content (login page)
  return children;
}

function RootRedirect() {
  const { admin, loading } = useAuth();

  // Wait for auth state to settle
  if (loading) return null;

  // Redirect based on auth status
  return <Navigate to={admin ? '/dashboard' : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1e293b',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '10px',
              fontSize: '14px',
            },
          }}
        />
        <Routes>
          <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
            <Route index element={<HomePage />} />
            <Route path="upload" element={<UploadPage />} />
            <Route path="documents" element={<DocumentsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
