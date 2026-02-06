// ============================================
// REVO — POS Module
// ============================================
// Location: apps/api/src/modules/pos/pos.module.ts
// ============================================

import { Module } from '@nestjs/common';
import { PosController } from './pos.controller';
import { PosService } from './pos.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
    controllers: [PosController],
    providers: [PosService, PrismaService],
})
export class PosModule {}