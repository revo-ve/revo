// ============================================
// REVO — usePermissions Hook
// ============================================
// Location: apps/dashboard/src/hooks/usePermissions.ts
// ============================================

import { useMemo } from 'react';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Hook para verificar permisos del usuario actual
 *
 * @example
 * const { can, canAny, canAll } = usePermissions();
 *
 * if (can('orders:create')) { ... }
 * if (canAny(['orders:create', 'orders:edit'])) { ... }
 * if (canAll(['orders:create', 'orders:edit'])) { ... }
 */
export function usePermissions() {
    const user = useAuthStore((s) => s.user);

    const permissions = useMemo(() => {
        if (!user?.role?.permissions) return new Set<string>();
        return new Set(
            user.role.permissions.map((p: any) => p.permission?.code || p.code)
        );
    }, [user]);

    const can = (permission: string): boolean => {
        return permissions.has(permission);
    };

    const canAny = (perms: string[]): boolean => {
        return perms.some((p) => permissions.has(p));
    };

    const canAll = (perms: string[]): boolean => {
        return perms.every((p) => permissions.has(p));
    };

    return {
        permissions,
        can,
        canAny,
        canAll,
        // Shortcuts para permisos comunes
        canViewDashboard: permissions.has('dashboard:view'),
        canManageMenu: canAny(['menu:create', 'menu:edit', 'menu:delete']),
        canManageOrders: canAny(['orders:create', 'orders:edit']),
        canAccessPOS: permissions.has('pos:access'),
        canProcessPayments: permissions.has('pos:process_payment'),
        canAccessKDS: permissions.has('kds:access'),
        canViewReports: permissions.has('reports:view'),
        canManageInventory: canAny(['inventory:manage', 'inventory:adjust']),
        canManageUsers: canAny(['users:create', 'users:edit', 'users:delete']),
        canManageRoles: permissions.has('roles:manage'),
        canEditSettings: permissions.has('settings:edit'),
    };
}