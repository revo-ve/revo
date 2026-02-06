// ============================================
// REVO — Menu Public Module
// ============================================
// Location: apps/api/src/modules/menu-public/menu-public.module.ts
// ============================================

import { Module } from '@nestjs/common';
import { MenuPublicController, QrManagementController } from './menu-public.controller';
import { MenuPublicService } from './menu-public.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
    controllers: [MenuPublicController, QrManagementController],
    providers: [MenuPublicService, PrismaService],
})
export class MenuPublicModule {}