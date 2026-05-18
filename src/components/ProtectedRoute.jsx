// ProtectedRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../authcontext/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user, loading, hasRole } = useAuth();
  const location = useLocation();

  if (loading) {
    // Show loading spinner or skeleton
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated()) {
    // Redirect to login but save the location they tried to access
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // Check role-based access if roles are required
  if (requiredRoles.length > 0) {
    const hasRequiredRole = requiredRoles.some(role => hasRole(role));
    if (!hasRequiredRole) {
      // User doesn't have required role, redirect to unauthorized page or home
      return <Navigate to="/unauthorized" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;