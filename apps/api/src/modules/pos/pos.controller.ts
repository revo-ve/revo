// ============================================
// REVO — POS Controller (with Permissions)
// ============================================
// Location: apps/api/src/modules/pos/pos.controller.ts
// ============================================

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PosService } from './pos.service';
import { TenantGuard } from '../../common/guards';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('pos')
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Get('products')
  @RequirePermissions('pos:access')
  getProducts(@Req() req: any) {
    return this.posService.getProductsForPOS(req.user.tenantId);
  }

  @Get('tables')
  @RequirePermissions('pos:access')
  getTables(@Req() req: any) {
    return this.posService.getTablesForPOS(req.user.tenantId);
  }

  @Get('open-orders')
  @RequirePermissions('pos:access')
  getOpenOrders(@Req() req: any) {
    return this.posService.getOpenOrders(req.user.tenantId);
  }

  @Get('stats')
  @RequirePermissions('pos:access')
  getStats(@Req() req: any) {
    return this.posService.getShiftStats(req.user.tenantId);
  }

  @Post('order')
  @RequirePermissions('orders:create', 'pos:access')
  createOrder(@Req() req: any, @Body() body: any) {
    return this.posService.createQuickOrder(
      req.user.tenantId,
      req.user.sub,
      body,
    );
  }

  @Post('order/:id/settle')
  @RequirePermissions('pos:process_payment')
  settleOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { paymentMethod: string },
  ) {
    return this.posService.settleOrder(
      req.user.tenantId,
      id,
      body.paymentMethod,
    );
  }
}
