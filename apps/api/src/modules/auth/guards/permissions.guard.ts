// ─────────────────────────────────────────────
// FILE: guards/permissions.guard.ts
// ─────────────────────────────────────────────

import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
// import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

const PERMISSIONS_KEY = 'permissions';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        // Get required permissions from decorator
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
            PERMISSIONS_KEY,
            [context.getHandler(), context.getClass()],
        );

        // No permissions required, allow access
        if (!requiredPermissions || requiredPermissions.length === 0) {
            return true;
        }

        // Get user from request (set by JwtAuthGuard)
        const request = context.switchToHttp().getRequest();
        const user = request.user;

        if (!user || !user.role || !user.role.permissions) {
            throw new ForbiddenException('No tienes permisos para esta acción');
        }

        // Get user's permission codes
        const userPermissions = user.role.permissions.map(
            (rp: { permission: { code: string } }) => rp.permission.code,
        );

        // Check if user has ANY of the required permissions
        const hasPermission = requiredPermissions.some((permission) =>
            userPermissions.includes(permission),
        );

        if (!hasPermission) {
            throw new ForbiddenException('No tienes permisos para esta acción');
        }

        return true;
    }
}