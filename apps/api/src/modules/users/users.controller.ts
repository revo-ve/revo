// ============================================
// REVO — Users Controller (with Email Invitation)
// ============================================
// Location: apps/api/src/modules/users/users.controller.ts
// ============================================

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { TenantGuard } from '../../common/guards';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('users')
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('users:view')
  getUsers(@Req() req: any) {
    return this.usersService.getUsers(req.user.tenantId);
  }

  @Get('roles')
  @RequirePermissions('users:view')
  getRoles(@Req() req: any) {
    return this.usersService.getRoles(req.user.tenantId);
  }

  @Get(':id')
  @RequirePermissions('users:view')
  getUser(@Req() req: any, @Param('id') id: string) {
    return this.usersService.getUser(req.user.tenantId, id);
  }

  @Post()
  @RequirePermissions('users:create')
  createUser(@Req() req: any, @Body() body: { name: string; email: string; roleId: string }) {
    return this.usersService.createUser(req.user.tenantId, req.user.id, body);
  }

  @Put(':id')
  @RequirePermissions('users:edit')
  updateUser(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.usersService.updateUser(
      req.user.tenantId,
      req.user.id,
      id,
      body,
    );
  }

  @Patch(':id/toggle-status')
  @RequirePermissions('users:edit')
  toggleStatus(@Req() req: any, @Param('id') id: string) {
    return this.usersService.toggleUserStatus(
      req.user.tenantId,
      req.user.id,
      id,
    );
  }

  // ─── Send password reset email ───
  @Post(':id/reset-password')
  @RequirePermissions('users:edit')
  resetPassword(@Req() req: any, @Param('id') id: string) {
    return this.usersService.resetPassword(req.user.tenantId, id);
  }

  // ─── Resend invitation email ───
  @Post(':id/resend-invitation')
  @RequirePermissions('users:edit')
  resendInvitation(@Req() req: any, @Param('id') id: string) {
    return this.usersService.resendInvitation(req.user.tenantId, id);
  }

  @Delete(':id')
  @RequirePermissions('users:delete')
  deleteUser(@Req() req: any, @Param('id') id: string) {
    return this.usersService.deleteUser(
      req.user.tenantId,
      req.user.id,
      id,
    );
  }
}
