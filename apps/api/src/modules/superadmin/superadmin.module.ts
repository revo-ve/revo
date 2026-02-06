// ============================================
// REVO — Super Admin Module
// ============================================
// Location: apps/api/src/modules/superadmin/superadmin.module.ts
// ============================================

import { Module } from '@nestjs/common';
import { SuperAdminController } from './superadmin.controller';
import { TenantsService } from './tenants.service';
import { PrismaModule } from '../../database/prisma.module';
import { MailModule } from '../mail/mail.module';
import { SuperAdminGuard } from '../../common/guards/superadmin.guard';

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [SuperAdminController],
  providers: [TenantsService, SuperAdminGuard],
  exports: [TenantsService],
})
export class SuperAdminModule {}
