import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';

import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import FaceRegistrationPage from './pages/FaceRegistrationPage';
import MyDatasetPage from './pages/MyDatasetPage';
import FacultyDashboard from './pages/FacultyDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfaff]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-nitte-200 border-t-nitte-600 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Loading NitteVision...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fbfaff]">
      <Navbar />

      <main className="flex-1">
        <ErrorBoundary>
          <Routes>
            {/* Public Authentication routes */}
            <Route
              path="/login"
              element={
                user ? (
                  user.role === 'student' ? <Navigate to="/dashboard" replace /> :
                  user.role === 'faculty' ? <Navigate to="/faculty" replace /> :
                  <Navigate to="/admin" replace />
                ) : (
                  <AuthPage initialTab="login" />
                )
              }
            />
            <Route
              path="/register"
              element={
                user ? <Navigate to="/dashboard" replace /> : <AuthPage initialTab="register" />
              }
            />

            {/* Student Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/face-registration" element={<FaceRegistrationPage />} />
              <Route path="/my-dataset" element={<MyDatasetPage />} />
            </Route>

            {/* Faculty Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['faculty', 'admin']} />}>
              <Route path="/faculty" element={<FacultyDashboard />} />
            </Route>

            {/* Admin Protected Routes */}
            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Root Redirect */}
            <Route
              path="/"
              element={
                user ? (
                  user.role === 'student' ? <Navigate to="/dashboard" replace /> :
                  user.role === 'faculty' ? <Navigate to="/faculty" replace /> :
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ErrorBoundary>
      </main>
    </div>
  );
}

export default App;
