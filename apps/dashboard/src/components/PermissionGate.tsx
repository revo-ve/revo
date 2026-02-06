// ============================================
// REVO — PermissionGate Component
// ============================================
// Location: apps/dashboard/src/components/PermissionGate.tsx
// ============================================

import { ReactNode } from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
    /** Single permission to check */
    permission?: string;
    /** Multiple permissions to check */
    permissions?: string[];
    /** If true, user must have ALL permissions. If false (default), user needs ANY */
    requireAll?: boolean;
    /** Content to show if user lacks permission */
    fallback?: ReactNode;
    /** Content to show if user has permission */
    children: ReactNode;
}

/**
 * Renders children only if user has the required permission(s)
 *
 * @example
 * // Single permission
 * <PermissionGate permission="orders:create">
 *   <button>Nuevo pedido</button>
 * </PermissionGate>
 *
 * @example
 * // Any of multiple permissions
 * <PermissionGate permissions={['menu:edit', 'menu:delete']}>
 *   <button>Editar menú</button>
 * </PermissionGate>
 *
 * @example
 * // All permissions required
 * <PermissionGate permissions={['reports:view', 'reports:export']} requireAll>
 *   <button>Exportar reporte</button>
 * </PermissionGate>
 *
 * @example
 * // With fallback
 * <PermissionGate permission="pos:access" fallback={<p>Sin acceso al POS</p>}>
 *   <POSPanel />
 * </PermissionGate>
 */
export function PermissionGate({
                                   permission,
                                   permissions,
                                   requireAll = false,
                                   fallback = null,
                                   children,
                               }: PermissionGateProps) {
    const { can, canAny, canAll } = usePermissions();

    let hasPermission = false;

    if (permission) {
        hasPermission = can(permission);
    } else if (permissions) {
        hasPermission = requireAll ? canAll(permissions) : canAny(permissions);
    } else {
        hasPermission = true; // No permission required
    }

    return hasPermission ? <>{children}</> : <>{fallback}</>;
}