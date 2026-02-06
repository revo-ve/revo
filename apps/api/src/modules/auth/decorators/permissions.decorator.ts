// ─────────────────────────────────────────────
// FILE: decorators/permissions.decorator.ts
// ─────────────────────────────────────────────

import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';

/**
 * Decorator to require specific permissions for a route
 * @param permissions - One or more permission codes required (ANY of them grants access)
 *
 * @example
 * @RequirePermissions('orders:create')
 * @RequirePermissions('orders:edit', 'orders:create') // User needs ANY of these
 */
export const RequirePermissions = (...permissions: string[]) =>
    SetMetadata(PERMISSIONS_KEY, permissions);