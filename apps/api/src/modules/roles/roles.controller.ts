// ============================================
// REVO — Roles Controller
// ============================================
// Location: apps/api/src/modules/roles/roles.controller.ts
// ============================================

import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    UseGuards,
    Req,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import {PermissionsGuard} from '../auth/guards/permissions.guard';
import {RequirePermissions} from '../auth/decorators/permissions.decorator';
import {RolesService} from './roles.service';
import {AuthGuard} from "@nestjs/passport";

interface AuthRequest {
    user: { id: string; tenantId: string; role: { permissions: { permission: { code: string } }[] } };
}

@Controller('roles')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class RolesController {
    constructor(private rolesService: RolesService) {
    }

    // ─── Get all permissions (catalog) ───
    @Get('permissions')
    @RequirePermissions('roles:view')
    async getPermissions() {
        const permissions = await this.rolesService.getAllPermissions();
        return {success: true, data: permissions};
    }

    // ─── Get all roles for tenant ───
    @Get()
    @RequirePermissions('roles:view')
    async getRoles(@Req() req: AuthRequest) {
        const roles = await this.rolesService.getRolesByTenant(req.user.tenantId);
        return {success: true, data: roles};
    }

    // ─── Get single role with permissions ───
    @Get(':id')
    @RequirePermissions('roles:view')
    async getRole(@Req() req: AuthRequest, @Param('id') id: string) {
        const role = await this.rolesService.getRoleById(id, req.user.tenantId);
        return {success: true, data: role};
    }

    // ─── Create new role ───
    @Post()
    @RequirePermissions('roles:manage')
    async createRole(
        @Req() req: AuthRequest,
        @Body() body: { name: string; description?: string; color?: string; permissionIds: string[] },
    ) {
        const role = await this.rolesService.createRole(req.user.tenantId, body);
        return {success: true, data: role};
    }

    // ─── Update role ───
    @Put(':id')
    @RequirePermissions('roles:manage')
    async updateRole(
        @Req() req: AuthRequest,
        @Param('id') id: string,
        @Body() body: { name?: string; description?: string; color?: string; permissionIds?: string[] },
    ) {
        const role = await this.rolesService.updateRole(id, req.user.tenantId, body);
        return {success: true, data: role};
    }

    // ─── Delete role ───
    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermissions('roles:manage')
    async deleteRole(@Req() req: AuthRequest, @Param('id') id: string) {
        await this.rolesService.deleteRole(id, req.user.tenantId);
        return {success: true, message: 'Rol eliminado'};
    }

    // ─── Set default role ───
    @Post(':id/set-default')
    @RequirePermissions('roles:manage')
    async setDefaultRole(@Req() req: AuthRequest, @Param('id') id: string) {
        const role = await this.rolesService.setDefaultRole(id, req.user.tenantId);
        return {success: true, data: role};
    }

    // ─── Duplicate role ───
    @Post(':id/duplicate')
    @RequirePermissions('roles:manage')
    async duplicateRole(
        @Req() req: AuthRequest,
        @Param('id') id: string,
        @Body() body: { name: string },
    ) {
        const role = await this.rolesService.duplicateRole(id, req.user.tenantId, body.name);
        return {success: true, data: role};
    }
}