"use client";

import { useAppSettings } from '@/context/AppSettingsContext';
import MaintenanceMode from './MaintenanceMode';
import { ReactNode } from 'react';

interface MaintenanceWrapperProps {
  children: ReactNode;
}

const MaintenanceWrapper = ({ children }: MaintenanceWrapperProps) => {
  const { appSettings, loading } = useAppSettings();

  // Show loading state while fetching settings
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse">
          <div className="h-16 bg-gray-300 rounded mb-6 w-96"></div>
          <div className="h-8 bg-gray-300 rounded mb-4 w-80"></div>
          <div className="h-6 bg-gray-300 rounded w-64"></div>
        </div>
      </div>
    );
  }

  // If maintenance mode is enabled, show maintenance page
  if (appSettings?.maintenanceMode) {
    return <MaintenanceMode />;
  }

  // Otherwise, show normal content
  return <>{children}</>;
};

export default MaintenanceWrapper; 