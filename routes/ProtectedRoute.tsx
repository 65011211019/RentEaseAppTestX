
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ROUTE_PATHS } from '../constants';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { useTranslation } from 'react-i18next';

interface ProtectedRouteProps {
  // children?: React.ReactNode; // Not needed when using Outlet
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = () => {
  const { user, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><LoadingSpinner message={t('protectedRoute.authenticating')} /></div>;
  }

  if (!user) {
    return <Navigate to={ROUTE_PATHS.LOGIN} replace />;
  }

  return <Outlet />; // Renders the child route's element
};
