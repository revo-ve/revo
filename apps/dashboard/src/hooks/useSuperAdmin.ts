// ============================================
// REVO — Super Admin Hook
// ============================================
// Location: apps/dashboard/src/hooks/useSuperAdmin.ts
// ============================================

import { useState, useEffect } from 'react';
import { useApi } from './useApi';

interface SuperAdminState {
  isSuperAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

export function useSuperAdmin(): SuperAdminState {
  const [state, setState] = useState<SuperAdminState>({
    isSuperAdmin: false,
    isLoading: true,
    error: null,
  });
  const { get } = useApi();

  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        // Try to access super admin endpoint
        await get('/superadmin/dashboard');
        setState({ isSuperAdmin: true, isLoading: false, error: null });
      } catch (err: any) {
        // 403 means not a super admin, other errors are actual errors
        if (err.status === 403) {
          setState({ isSuperAdmin: false, isLoading: false, error: null });
        } else {
          setState({ isSuperAdmin: false, isLoading: false, error: err.message });
        }
      }
    };

    const token = localStorage.getItem('revo_access_token');
    if (token) {
      checkSuperAdmin();
    } else {
      setState({ isSuperAdmin: false, isLoading: false, error: null });
    }
  }, []);

  return state;
}
