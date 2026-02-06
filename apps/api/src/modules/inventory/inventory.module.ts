// ============================================
// REVO — Inventory Module
// ============================================
// Location: apps/api/src/modules/inventory/inventory.module.ts
// ============================================

import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
    controllers: [InventoryController],
    providers: [InventoryService, PrismaService],
})
export class InventoryModule {}