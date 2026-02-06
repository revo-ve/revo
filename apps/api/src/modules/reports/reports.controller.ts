// ============================================
// REVO — Reports Controller (with Permissions)
// ============================================
// Location: apps/api/src/modules/reports/reports.controller.ts
// ============================================

import {
  Controller,
  Get,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { TenantGuard } from '../../common/guards';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('reports')
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
@RequirePermissions('reports:view')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // Helper to parse date range from query params
  private parseDates(from?: string, to?: string) {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    return {
      from: from ? new Date(from) : startOfToday,
      to: to ? new Date(to) : now,
    };
  }

  @Get('summary')
  getSummary(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const dates = this.parseDates(from, to);
    return this.reportsService.getSalesSummary(req.user.tenantId, dates.from, dates.to);
  }

  @Get('by-day')
  getByDay(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const dates = this.parseDates(from, to);
    return this.reportsService.getSalesByDay(req.user.tenantId, dates.from, dates.to);
  }

  @Get('by-hour')
  getByHour(
    @Req() req: any,
    @Query('date') date?: string,
  ) {
    const d = date ? new Date(date) : new Date();
    return this.reportsService.getSalesByHour(req.user.tenantId, d);
  }

  @Get('top-products')
  getTopProducts(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
  ) {
    const dates = this.parseDates(from, to);
    return this.reportsService.getTopProducts(
      req.user.tenantId,
      dates.from,
      dates.to,
      limit ? parseInt(limit, 10) : 10,
    );
  }

  @Get('by-category')
  getByCategory(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const dates = this.parseDates(from, to);
    return this.reportsService.getSalesByCategory(req.user.tenantId, dates.from, dates.to);
  }

  @Get('by-waiter')
  getByWaiter(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const dates = this.parseDates(from, to);
    return this.reportsService.getSalesByWaiter(req.user.tenantId, dates.from, dates.to);
  }

  @Get('comparison')
  getComparison(
    @Req() req: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const dates = this.parseDates(from, to);
    return this.reportsService.getComparison(req.user.tenantId, dates.from, dates.to);
  }
}
