// ============================================
// REVO — Roles Service
// ============================================
// Location: apps/api/src/modules/roles/roles.service.ts
// ============================================

import {
    Injectable,
    NotFoundException,
    ConflictException,
    BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RolesService {
    constructor(private prisma: PrismaService) {}

    // ─── Get all permissions (global catalog) ───
    async getAllPermissions() {
        return this.prisma.permission.findMany({
            orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }],
        });
    }

    // ─── Get permissions grouped by module ───
    async getPermissionsGrouped() {
        const permissions = await this.getAllPermissions();

        const grouped: Record<string, typeof permissions> = {};
        for (const permission of permissions) {
            if (!grouped[permission.module]) {
                grouped[permission.module] = [];
            }
            grouped[permission.module].push(permission);
        }

        return grouped;
    }

    // ─── Get all roles for a tenant ───
    async getRolesByTenant(tenantId: string) {
        return this.prisma.role.findMany({
            where: { tenantId, isActive: true },
            include: {
                _count: { select: { users: true, permissions: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    // ─── Get role by ID ───
    async getRoleById(id: string, tenantId: string) {
        const role = await this.prisma.role.findFirst({
            where: { id, tenantId },
            include: {
                permissions: {
                    include: { permission: true },
                },
                _count: { select: { users: true } },
            },
        });

        if (!role) {
            throw new NotFoundException('Rol no encontrado');
        }

        return {
            ...role,
            permissionIds: role.permissions.map((rp) => rp.permissionId),
            permissionCodes: role.permissions.map((rp) => rp.permission.code),
        };
    }

    // ─── Create role ───
    async createRole(
        tenantId: string,
        data: { name: string; description?: string; color?: string; permissionIds: string[] },
    ) {
        // Check name uniqueness
        const existing = await this.prisma.role.findUnique({
            where: { tenantId_name: { tenantId, name: data.name } },
        });

        if (existing) {
            throw new ConflictException('Ya existe un rol con ese nombre');
        }

        // Validate permissions exist
        const validPermissions = await this.prisma.permission.findMany({
            where: { id: { in: data.permissionIds } },
        });

        if (validPermissions.length !== data.permissionIds.length) {
            throw new BadRequestException('Algunos permisos no son válidos');
        }

        return this.prisma.role.create({
            data: {
                tenantId,
                name: data.name,
                description: data.description,
                color: data.color || '#6B8F71',
                permissions: {
                    create: data.permissionIds.map((permissionId) => ({ permissionId })),
                },
            },
            include: {
                permissions: { include: { permission: true } },
                _count: { select: { users: true } },
            },
        });
    }

    // ─── Update role ───
    async updateRole(
        id: string,
        tenantId: string,
        data: { name?: string; description?: string; color?: string; permissionIds?: string[] },
    ) {
        // Verify role exists and belongs to tenant
        const role = await this.prisma.role.findFirst({
            where: { id, tenantId },
        });

        if (!role) {
            throw new NotFoundException('Rol no encontrado');
        }

        // Check name uniqueness if changing name
        if (data.name && data.name !== role.name) {
            const existing = await this.prisma.role.findUnique({
                where: { tenantId_name: { tenantId, name: data.name } },
            });

            if (existing) {
                throw new ConflictException('Ya existe un rol con ese nombre');
            }
        }

        // Update in transaction
        return this.prisma.$transaction(async (tx) => {
            // Update role basic info
            await tx.role.update({
                where: { id },
                data: {
                    name: data.name,
                    description: data.description,
                    color: data.color,
                },
            });

            // Update permissions if provided
            if (data.permissionIds) {
                // Delete existing permissions
                await tx.rolePermission.deleteMany({ where: { roleId: id } });

                // Add new permissions
                await tx.rolePermission.createMany({
                    data: data.permissionIds.map((permissionId) => ({
                        roleId: id,
                        permissionId,
                    })),
                });
            }

            // Return updated role
            return tx.role.findUnique({
                where: { id },
                include: {
                    permissions: { include: { permission: true } },
                    _count: { select: { users: true } },
                },
            });
        });
    }

    // ─── Delete role ───
    async deleteRole(id: string, tenantId: string) {
        const role = await this.prisma.role.findFirst({
            where: { id, tenantId },
            include: { _count: { select: { users: true } } },
        });

        if (!role) {
            throw new NotFoundException('Rol no encontrado');
        }

        if (role._count.users > 0) {
            throw new BadRequestException(
                `No se puede eliminar: ${role._count.users} usuario(s) tienen este rol asignado`,
            );
        }

        await this.prisma.role.delete({ where: { id } });
    }

    // ─── Set default role ───
    async setDefaultRole(id: string, tenantId: string) {
        const role = await this.prisma.role.findFirst({
            where: { id, tenantId },
        });

        if (!role) {
            throw new NotFoundException('Rol no encontrado');
        }

        // Remove default from all other roles
        await this.prisma.role.updateMany({
            where: { tenantId, isDefault: true },
            data: { isDefault: false },
        });

        // Set this role as default
        return this.prisma.role.update({
            where: { id },
            data: { isDefault: true },
        });
    }

    // ─── Duplicate role ───
    async duplicateRole(id: string, tenantId: string, newName: string) {
        const original = await this.getRoleById(id, tenantId);

        return this.createRole(tenantId, {
            name: newName,
            description: `Copia de ${original.name}`,
            color: original.color || '#6B8F71',
            permissionIds: original.permissionIds,
        });
    }

    // ─── Get default role for tenant ───
    async getDefaultRole(tenantId: string) {
        return this.prisma.role.findFirst({
            where: { tenantId, isDefault: true, isActive: true },
        });
    }

    // ─── Check if user has permission ───
    async userHasPermission(userId: string, permissionCode: string): Promise<boolean> {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: {
                role: {
                    include: {
                        permissions: {
                            include: { permission: true },
                        },
                    },
                },
            },
        });

        if (!user) return false;

        return user.role.permissions.some((rp) => rp.permission.code === permissionCode);
    }
}