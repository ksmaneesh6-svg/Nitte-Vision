import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fbfaff]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-nitte-200 border-t-nitte-600 rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-medium">Verifying NitteVision session...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect to their default dashboard based on their role
    if (user.role === 'student') return <Navigate to="/dashboard" replace />;
    if (user.role === 'faculty') return <Navigate to="/faculty" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
