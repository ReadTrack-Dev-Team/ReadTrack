import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps protected routes to ensure user is authenticated.
 * Waits for auth loading to complete before redirecting.
 */
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show nothing (or a spinner) while auth is loading
  if (loading) {
    return (
      <div className="rt-loading-container">
        <div className="rt-spinner"></div>
      </div>
    );
  }

  // Not logged in -> redirect to login, preserving intended destination
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default PrivateRoute;
