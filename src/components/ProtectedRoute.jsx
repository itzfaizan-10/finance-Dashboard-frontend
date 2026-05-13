// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// import { useAuth } from '../authcontext/AuthContext';
import { useAuth } from '../authcontext/AuthContext'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;