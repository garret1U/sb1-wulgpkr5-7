import React, { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCurrentUserProfile } from '../lib/api';

interface PermissionsContextType {
  isAdmin: boolean;
  canModifyCircuits: boolean;
  canViewCircuits: boolean;
  isLoading: boolean;
}

const PermissionsContext = createContext<PermissionsContextType | null>(null);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['currentProfile'],
    queryFn: getCurrentUserProfile
  });

  const value = {
    isAdmin: profile?.role === 'admin',
    canModifyCircuits: profile?.role === 'admin',
    canViewCircuits: true, // All authenticated users can view
    isLoading
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}