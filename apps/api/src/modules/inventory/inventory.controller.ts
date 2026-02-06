// ============================================
// REVO — Inventory Controller (with Permissions)
// ============================================
// Location: apps/api/src/modules/inventory/inventory.controller.ts
// ============================================

import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InventoryService } from './inventory.service';
import { TenantGuard } from '../../common/guards';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('inventory')
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get()
  @RequirePermissions('inventory:view')
  getInventory(
    @Req() req: any,
    @Query('category') category?: string,
    @Query('lowStock') lowStock?: string,
    @Query('search') search?: string,
  ) {
    return this.inventoryService.getInventory(req.user.tenantId, {
      category: category || undefined,
      lowStock: lowStock === 'true',
      search: search || undefined,
    });
  }

  @Get('stats')
  @RequirePermissions('inventory:view')
  getStats(@Req() req: any) {
    return this.inventoryService.getInventoryStats(req.user.tenantId);
  }

  @Get('alerts')
  @RequirePermissions('inventory:view')
  getAlerts(@Req() req: any) {
    return this.inventoryService.getAlerts(req.user.tenantId);
  }

  @Get('movements')
  @RequirePermissions('inventory:view')
  getMovements(
    @Req() req: any,
    @Query('productId') productId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.inventoryService.getMovements(
      req.user.tenantId,
      productId || undefined,
      limit ? parseInt(limit, 10) : 50,
    );
  }

  @Post(':id/add')
  @RequirePermissions('inventory:adjust')
  addStock(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { quantity: number; type: 'PURCHASE' | 'RETURN'; reason?: string },
  ) {
    return this.inventoryService.addStock(req.user.tenantId, req.user.sub, id, body);
  }

  @Post(':id/remove')
  @RequirePermissions('inventory:adjust')
  removeStock(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { quantity: number; type: 'SALE' | 'WASTE' | 'TRANSFER'; reason?: string },
  ) {
    return this.inventoryService.removeStock(req.user.tenantId, req.user.sub, id, body);
  }

  @Post(':id/adjust')
  @RequirePermissions('inventory:adjust')
  adjustStock(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { newQuantity: number; reason?: string },
  ) {
    return this.inventoryService.adjustStock(req.user.tenantId, req.user.sub, id, body);
  }

  @Put(':id/settings')
  @RequirePermissions('inventory:manage')
  updateSettings(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { minStock?: number; stockUnit?: string; trackStock?: boolean },
  ) {
    return this.inventoryService.updateStockSettings(req.user.tenantId, id, body);
  }
}
