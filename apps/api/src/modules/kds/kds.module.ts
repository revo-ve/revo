// ============================================
// REVO — KDS Module
// ============================================
// Location: apps/api/src/modules/kds/kds.module.ts
// ============================================

import { Module } from '@nestjs/common';
import { KdsController } from './kds.controller';
import { KdsService } from './kds.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
    controllers: [KdsController],
    providers: [KdsService, PrismaService],
})
export class KdsModule {}