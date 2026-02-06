// ============================================
// REVO — Super Admin Guard
// ============================================
// Location: apps/api/src/common/guards/superadmin.guard.ts
// ============================================

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.id) {
      throw new ForbiddenException('No autenticado');
    }

    // Check if user is super admin
    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: { isSuperAdmin: true },
    });

    if (!dbUser?.isSuperAdmin) {
      throw new ForbiddenException('Acceso restringido a Super Administradores');
    }

    return true;
  }
}
