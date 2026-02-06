// ============================================
// REVO — Dashboard Controller (with Permissions)
// ============================================
// Location: apps/api/src/modules/dashboard/dashboard.controller.ts
// ============================================

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';
import { TenantGuard, TenantId } from '../../common/guards';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('dashboard')
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
@RequirePermissions('dashboard:view')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  getTodayStats(@TenantId() tenantId: string) {
    return this.dashboardService.getTodayStats(tenantId);
  }

  @Get('orders-by-status')
  getOrdersByStatus(@TenantId() tenantId: string) {
    return this.dashboardService.getOrdersByStatus(tenantId);
  }

  @Get('sales-week')
  getSalesLast7Days(@TenantId() tenantId: string) {
    return this.dashboardService.getSalesLast7Days(tenantId);
  }

  @Get('sales-hourly')
  getHourlySalesToday(@TenantId() tenantId: string) {
    return this.dashboardService.getHourlySalesToday(tenantId);
  }

  @Get('top-products')
  getTopProducts(
    @TenantId() tenantId: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getTopProducts(tenantId, limit ? parseInt(limit) : 10);
  }

  @Get('recent-orders')
  getRecentOrders(
    @TenantId() tenantId: string,
    @Query('limit') limit?: string,
  ) {
    return this.dashboardService.getRecentOrders(tenantId, limit ? parseInt(limit) : 8);
  }
}
