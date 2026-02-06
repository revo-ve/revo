// ============================================
// REVO — Tenants Service (Super Admin)
// ============================================
// Location: apps/api/src/modules/superadmin/tenants.service.ts
// ============================================

import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

@Injectable()
export class TenantsService {
  constructor(
      private prisma: PrismaService,
      private mailService: MailService,
  ) {}

  // ─── Get all tenants with stats ───
  async getAllTenants() {
    const tenants = await this.prisma.tenant.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            users: true,
            categories: true,
            products: true,
            orders: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tenants.map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      isActive: t.isActive,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      stats: {
        users: t._count.users,
        categories: t._count.categories,
        products: t._count.products,
        orders: t._count.orders,
      },
    }));
  }

  // ─── Get single tenant with details ───
  async getTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true,
            createdAt: true,
            inviteToken: true,
            role: {
              select: {
                id: true,
                name: true,
                color: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        roles: {
          select: {
            id: true,
            name: true,
            color: true,
            _count: { select: { users: true } },
          },
        },
        _count: {
          select: {
            categories: true,
            products: true,
            orders: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
      users: tenant.users.map((u) => ({
        ...u,
        isPending: !!u.inviteToken,
      })),
      roles: tenant.roles.map((r) => ({
        id: r.id,
        name: r.name,
        color: r.color,
        usersCount: r._count.users,
      })),
      stats: {
        categories: tenant._count.categories,
        products: tenant._count.products,
        orders: tenant._count.orders,
      },
    };
  }

  // ─── Get dashboard stats ───
  async getDashboardStats() {
    const [
      totalTenants,
      activeTenants,
      totalUsers,
      totalOrders,
      tenantsThisMonth,
    ] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.count({ where: { isActive: true } }),
      this.prisma.user.count(),
      this.prisma.order.count(),
      this.prisma.tenant.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    // Recent tenants
    const recentTenants = await this.prisma.tenant.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
    });

    return {
      totalTenants,
      activeTenants,
      inactiveTenants: totalTenants - activeTenants,
      totalUsers,
      totalOrders,
      tenantsThisMonth,
      recentTenants: recentTenants.map((t) => ({
        id: t.id,
        name: t.name,
        createdAt: t.createdAt,
        usersCount: t._count.users,
      })),
    };
  }

  // ─── Create tenant with owner ───
  async createTenant(data: {
    name: string;
    slug: string;
    ownerName: string;
    ownerEmail: string;
  }) {
    // Validate slug format
    const slugRegex = /^[a-z0-9-]+$/;
    if (!slugRegex.test(data.slug)) {
      throw new BadRequestException(
          'El slug solo puede contener letras minúsculas, números y guiones',
      );
    }

    // Check if slug already exists
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { slug: data.slug },
    });
    if (existingTenant) {
      throw new ConflictException('Ya existe un restaurante con ese slug');
    }

    // Check if email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: { email: data.ownerEmail.toLowerCase() },
    });
    if (existingUser) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    // Get all permissions for owner role
    const allPermissions = await this.prisma.permission.findMany({
      select: { id: true },
    });

    // Create tenant with roles and owner in a transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create tenant
      const tenant = await tx.tenant.create({
        data: {
          name: data.name.trim(),
          slug: data.slug.toLowerCase(),
          isActive: true,
        },
      });

      // 2. Create default roles
      const ownerRole = await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Dueño',
          color: '#3D4F2F',
          description: 'Acceso total al sistema',
          isDefault: false,
          permissions: {
            create: allPermissions.map((p) => ({
              permissionId: p.id,
            })),
          },
        },
      });

      await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Administrador',
          color: '#6B8F71',
          description: 'Gestión del negocio',
          isDefault: false,
          permissions: {
            create: allPermissions
                .filter((_, i) => i < allPermissions.length - 2) // All except roles:manage
                .map((p) => ({ permissionId: p.id })),
          },
        },
      });

      // Get basic permissions for mesero/cocinero
      const basicPermissions = await tx.permission.findMany({
        where: {
          code: {
            in: [
              'dashboard:view',
              'orders:view',
              'orders:create',
              'orders:edit',
              'tables:view',
              'menu:view',
            ],
          },
        },
        select: { id: true },
      });

      const kitchenPermissions = await tx.permission.findMany({
        where: {
          code: { in: ['kds:access', 'orders:view'] },
        },
        select: { id: true },
      });

      await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Mesero',
          color: '#C4785A',
          description: 'Atención al cliente',
          isDefault: true,
          permissions: {
            create: basicPermissions.map((p) => ({ permissionId: p.id })),
          },
        },
      });

      await tx.role.create({
        data: {
          tenantId: tenant.id,
          name: 'Cocinero',
          color: '#8B5A2B',
          description: 'Preparación de pedidos',
          isDefault: false,
          permissions: {
            create: kitchenPermissions.map((p) => ({ permissionId: p.id })),
          },
        },
      });

      // 3. Generate invite token for owner
      const inviteToken = crypto.randomBytes(32).toString('hex');
      const inviteTokenHash = crypto
          .createHash('sha256')
          .update(inviteToken)
          .digest('hex');
      const inviteTokenExpiry = new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
      ); // 7 days

      // 4. Create owner user
      const tempPassword = await bcrypt.hash(
          crypto.randomBytes(16).toString('hex'),
          12,
      );

      const owner = await tx.user.create({
        data: {
          tenantId: tenant.id,
          name: data.ownerName.trim(),
          email: data.ownerEmail.toLowerCase().trim(),
          password: tempPassword,
          roleId: ownerRole.id,
          isActive: false,
          inviteToken: inviteTokenHash,
          inviteTokenExpiry,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: { select: { name: true } },
        },
      });

      return { tenant, owner, inviteToken };
    });

    // 5. Send welcome email to restaurant owner
    await this.mailService.sendRestaurantCreatedEmail(
        result.owner.email,
        result.owner.name,
        result.tenant.name,
        result.inviteToken,
    );

    return {
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      owner: {
        id: result.owner.id,
        name: result.owner.name,
        email: result.owner.email,
      },
      inviteSent: true,
    };
  }

  // ─── Update tenant ───
  async updateTenant(
      tenantId: string,
      data: { name?: string; slug?: string; isActive?: boolean },
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    // If changing slug, validate and check for duplicates
    if (data.slug && data.slug !== tenant.slug) {
      const slugRegex = /^[a-z0-9-]+$/;
      if (!slugRegex.test(data.slug)) {
        throw new BadRequestException(
            'El slug solo puede contener letras minúsculas, números y guiones',
        );
      }

      const existing = await this.prisma.tenant.findUnique({
        where: { slug: data.slug },
      });
      if (existing) {
        throw new ConflictException('Ya existe un restaurante con ese slug');
      }
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        ...(data.name && { name: data.name.trim() }),
        ...(data.slug && { slug: data.slug.toLowerCase() }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
        updatedAt: true,
      },
    });

    return updated;
  }

  // ─── Toggle tenant status ───
  async toggleTenantStatus(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: !tenant.isActive },
      select: { id: true, isActive: true },
    });

    return { success: true, isActive: updated.isActive };
  }

  // ─── Delete tenant (soft delete) ───
  async deleteTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    // Soft delete: deactivate
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { isActive: false },
    });

    return { success: true, message: 'Restaurante desactivado' };
  }
}