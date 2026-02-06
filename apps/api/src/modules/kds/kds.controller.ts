// ============================================
// REVO — KDS Controller (with Permissions)
// ============================================
// Location: apps/api/src/modules/kds/kds.controller.ts
// ============================================

import {
  Controller,
  Get,
  Post,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { KdsService } from './kds.service';
import { TenantGuard } from '../../common/guards';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('kds')
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
export class KdsController {
  constructor(private readonly kdsService: KdsService) {}

  @Get('orders')
  @RequirePermissions('kds:access')
  getKitchenOrders(@Req() req: any) {
    return this.kdsService.getKitchenOrders(req.user.tenantId);
  }

  @Get('stats')
  @RequirePermissions('kds:access')
  getStats(@Req() req: any) {
    return this.kdsService.getKitchenStats(req.user.tenantId);
  }

  @Post('item/:id/advance')
  @RequirePermissions('kds:update_status')
  advanceItem(@Req() req: any, @Param('id') id: string) {
    return this.kdsService.advanceItemStatus(req.user.tenantId, id);
  }

  @Post('order/:id/advance-all')
  @RequirePermissions('kds:update_status')
  advanceAll(@Req() req: any, @Param('id') id: string) {
    return this.kdsService.advanceAllItems(req.user.tenantId, id);
  }

  @Post('item/:id/recall')
  @RequirePermissions('kds:update_status')
  recallItem(@Req() req: any, @Param('id') id: string) {
    return this.kdsService.recallItem(req.user.tenantId, id);
  }
}
