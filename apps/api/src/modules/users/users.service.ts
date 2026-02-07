// ============================================
// REVO — Users Service (with Email Invitation)
// ============================================
// Location: apps/api/src/modules/users/users.service.ts
// ============================================

import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  // ─── List all users for tenant ───
  async getUsers(tenantId: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        inviteToken: true, // To check pending invitations
        role: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
        _count: {
          select: {
            orders: { where: { status: 'PAID' } },
          },
        },
      },
      orderBy: [
        { role: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      isPending: !!u.inviteToken, // Has pending invitation
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      totalOrders: u._count.orders,
    }));
  }

  // ─── Get single user detail ───
  async getUser(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        inviteToken: true,
        role: {
          select: {
            id: true,
            name: true,
            color: true,
            permissions: {
              select: {
                permission: {
                  select: {
                    code: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: {
        id: user.role?.id,
        name: user.role?.name,
        color: user.role?.color,
        permissions: user.role?.permissions.map((p) => p.permission.code) || [],
      },
      isActive: user.isActive,
      isPending: !!user.inviteToken,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      totalOrders: user._count.orders,
    };
  }

  // ─── Create user (with email invitation) ───
  async createUser(
    tenantId: string,
    requestorId: string,
    data: { name: string; email: string; roleId: string },
  ) {
    // Validate role exists and belongs to tenant
    const role = await this.prisma.role.findFirst({
      where: { id: data.roleId, tenantId },
    });
    if (!role) throw new BadRequestException('Rol no válido');

    // Check duplicate email within tenant
    const existing = await this.prisma.user.findFirst({
      where: { tenantId, email: data.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Ya existe un usuario con ese email en este restaurante');

    // Get tenant info for email
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    // Generate invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create user with temporary password (won't be used until they accept invite)
    const tempPassword = await bcrypt.hash(crypto.randomBytes(16).toString('hex'), 12);

    const user = await this.prisma.user.create({
      data: {
        tenantId,
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: tempPassword,
        roleId: data.roleId,
        isActive: false, // Will be activated when they set password
        inviteToken: inviteTokenHash,
        inviteTokenExpiry,
        createdBy: requestorId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    // Send invitation email
    await this.mailService.sendInvitationEmail(
      user.email,
      user.name,
      inviteToken,
      tenant?.name || 'REVO',
      user.role?.name || 'Usuario',
    );

    return {
      ...user,
      isPending: true,
      inviteSent: true,
    };
  }

  // ─── Resend invitation ───
  async resendInvitation(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { role: true, tenant: true },
    });

    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Check if user is already active
    if (user.isActive && !user.inviteToken) {
      throw new BadRequestException('Este usuario ya activó su cuenta');
    }

    // Generate new invite token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    const inviteTokenHash = crypto.createHash('sha256').update(inviteToken).digest('hex');
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        inviteToken: inviteTokenHash,
        inviteTokenExpiry,
        isActive: false,
      },
    });

    // Send email
    await this.mailService.sendInvitationEmail(
      user.email,
      user.name,
      inviteToken,
      user.tenant?.name || 'REVO',
      user.role?.name || 'Usuario',
    );

    return { success: true, message: 'Invitación reenviada' };
  }

  // ─── Update user ───
  async updateUser(
    tenantId: string,
    requestorId: string,
    userId: string,
    data: { name?: string; email?: string; roleId?: string; isActive?: boolean },
  ) {
    const target = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { role: true },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado');

    // If changing role, validate it exists and belongs to tenant
    if (data.roleId) {
      const newRole = await this.prisma.role.findFirst({
        where: { id: data.roleId, tenantId },
      });
      if (!newRole) throw new BadRequestException('Rol no válido');
    }

    // If changing email, check for duplicates
    if (data.email && data.email.toLowerCase() !== target.email) {
      const dup = await this.prisma.user.findFirst({
        where: { tenantId, email: data.email.toLowerCase(), id: { not: userId } },
      });
      if (dup) throw new ConflictException('Ya existe un usuario con ese email');
    }

    // Prevent deactivating if user is the only one with a critical role
    if (data.isActive === false) {
      const roleUserCount = await this.prisma.user.count({
        where: { tenantId, roleId: target.roleId ?? undefined, isActive: true },
      });

      // Check if the role has critical permissions (like roles:manage)
      const criticalPermissions = await this.prisma.rolePermission.findFirst({
        where: {
          roleId: target.roleId ?? undefined,
          permission: { code: 'roles:manage' },
        },
      });

      if (criticalPermissions && roleUserCount <= 1) {
        throw new ForbiddenException(
          'No puedes desactivar al único usuario con permisos de administración',
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name.trim();
    if (data.email !== undefined) updateData.email = data.email.toLowerCase().trim();
    if (data.roleId !== undefined) updateData.roleId = data.roleId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        updatedAt: true,
        inviteToken: true,
        role: {
          select: {
            id: true,
            name: true,
            color: true,
          },
        },
      },
    });

    return {
      ...updated,
      isPending: !!updated.inviteToken,
    };
  }

  // ─── Reset password (send reset email) ───
  async resetPassword(tenantId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { tenant: true },
    });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        resetToken: resetTokenHash,
        resetTokenExpiry,
      },
    });

    // Send email
    await this.mailService.sendPasswordResetEmail(
      user.email,
      user.name,
      resetToken,
      user.tenant?.name || 'REVO',
    );

    return { success: true, message: 'Email de recuperación enviado' };
  }

  // ─── Delete user (soft: deactivate) ───
  async deleteUser(
    tenantId: string,
    requestorId: string,
    userId: string,
  ) {
    if (requestorId === userId) {
      throw new ForbiddenException('No puedes eliminarte a ti mismo');
    }

    const target = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
      include: { role: true },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado');

    // Check if this is the last user with roles:manage permission
    const criticalPermission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId: target.roleId ?? undefined,
        permission: { code: 'roles:manage' },
      },
    });

    if (criticalPermission) {
      // Count active users with roles:manage permission
      const adminsCount = await this.prisma.user.count({
        where: {
          tenantId,
          isActive: true,
          role: {
            permissions: {
              some: {
                permission: { code: 'roles:manage' },
              },
            },
          },
        },
      });

      if (adminsCount <= 1) {
        throw new ForbiddenException(
          'No puedes eliminar al único usuario con permisos de administración',
        );
      }
    }

    // Soft delete: deactivate and clear tokens
    await this.prisma.user.update({
      where: { id: userId },
      data: { 
        isActive: false,
        inviteToken: null,
        inviteTokenExpiry: null,
      },
    });

    return { success: true, message: 'Usuario desactivado' };
  }

  // ─── Get available roles for tenant ───
  async getRoles(tenantId: string) {
    const roles = await this.prisma.role.findMany({
      where: { tenantId },
      select: {
        id: true,
        name: true,
        color: true,
        description: true,
        isDefault: true,
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return roles.map((r) => ({
      id: r.id,
      name: r.name,
      color: r.color,
      description: r.description,
      isDefault: r.isDefault,
      usersCount: r._count.users,
    }));
  }

  // ─── Toggle user active status ───
  async toggleUserStatus(tenantId: string, requestorId: string, userId: string) {
    if (requestorId === userId) {
      throw new ForbiddenException('No puedes desactivarte a ti mismo');
    }

    const target = await this.prisma.user.findFirst({
      where: { id: userId, tenantId },
    });
    if (!target) throw new NotFoundException('Usuario no encontrado');

    // If activating, just do it
    if (!target.isActive) {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
        select: { id: true, isActive: true },
      });
      return { success: true, isActive: updated.isActive };
    }

    // If deactivating, check for last admin
    const criticalPermission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId: target.roleId ?? undefined,
        permission: { code: 'roles:manage' },
      },
    });

    if (criticalPermission) {
      const adminsCount = await this.prisma.user.count({
        where: {
          tenantId,
          isActive: true,
          role: {
            permissions: {
              some: {
                permission: { code: 'roles:manage' },
              },
            },
          },
        },
      });

      if (adminsCount <= 1) {
        throw new ForbiddenException(
          'No puedes desactivar al único usuario con permisos de administración',
        );
      }
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });

    return { success: true, isActive: updated.isActive };
  }
}
