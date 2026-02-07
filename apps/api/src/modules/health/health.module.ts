// ============================================
// REVO — Health Module
// ============================================
// Location: apps/api/src/modules/health/health.module.ts
// ============================================

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
    controllers: [HealthController],
})
export class HealthModule {}