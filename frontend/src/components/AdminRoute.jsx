import React from 'react';
import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const AdminRoute = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/auth" />;
  if (user?.role !== 'admin') return <Navigate to="/" />;
  return children;
};

export default AdminRoute;
