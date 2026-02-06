// ============================================
// REVO — Reports Module
// ============================================
// Location: apps/api/src/modules/reports/reports.module.ts
// ============================================

import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
    controllers: [ReportsController],
    providers: [ReportsService, PrismaService],
})
export class ReportsModule {}