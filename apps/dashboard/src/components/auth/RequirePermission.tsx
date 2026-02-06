// ============================================
// REVO — Require Permission Route Guard
// ============================================
// Location: apps/dashboard/src/components/auth/RequirePermission.tsx
// ============================================

import { useState, useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthStore } from '../../stores/auth.store';

interface RequirePermissionProps {
  /** Single permission required */
  permission?: string;
  /** Multiple permissions (user needs ANY of these) */
  permissions?: string[];
  /** If true, user must have ALL permissions */
  requireAll?: boolean;
  /** Where to redirect if no permission (default: /access-denied) */
  redirectTo?: string;
  /** Children to render (optional, uses Outlet if not provided) */
  children?: React.ReactNode;
}

/**
 * Route guard that checks permissions before rendering
 * 
 * @example
 * // Single permission
 * <Route element={<RequirePermission permission="users:view" />}>
 *   <Route path="/users" element={<UsersPage />} />
 * </Route>
 * 
 * @example
 * // Any of multiple permissions
 * <Route element={<RequirePermission permissions={['orders:view', 'pos:access']} />}>
 *   <Route path="/orders" element={<OrdersPage />} />
 * </Route>
 */
export default function RequirePermission({
  permission,
  permissions,
  requireAll = false,
  redirectTo = '/access-denied',
  children,
}: RequirePermissionProps) {
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const { can, canAny, canAll, permissions: userPermissions } = usePermissions();
  const [isLoading, setIsLoading] = useState(true);

  // Wait for user to be loaded from DashboardLayout
  useEffect(() => {
    // Give DashboardLayout time to fetch user data
    // The user should be loaded within 2 seconds max
    const timeout = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    // If user is already loaded, stop waiting
    if (user && user.role) {
      setIsLoading(false);
      clearTimeout(timeout);
    }

    return () => clearTimeout(timeout);
  }, [user]);

  // Still loading user data
  if (isLoading && !user?.role) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-arcilla-200 border-t-arcilla-500 rounded-full animate-spin" />
      </div>
    );
  }

  // User loaded but no permissions = no access
  if (!user?.role?.permissions || userPermissions.size === 0) {
    // If no permission required, allow access
    if (!permission && (!permissions || permissions.length === 0)) {
      return children ? <>{children}</> : <Outlet />;
    }
    // Otherwise, deny access
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location, requiredPermission: permission || permissions }} 
        replace 
      />
    );
  }

  let hasPermission = false;

  if (permission) {
    hasPermission = can(permission);
  } else if (permissions && permissions.length > 0) {
    hasPermission = requireAll ? canAll(permissions) : canAny(permissions);
  } else {
    // No permission specified, allow access
    hasPermission = true;
  }

  if (!hasPermission) {
    // Redirect to access denied page, preserving the attempted URL
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location, requiredPermission: permission || permissions }} 
        replace 
      />
    );
  }

  // Render children or Outlet
  return children ? <>{children}</> : <Outlet />;
}
