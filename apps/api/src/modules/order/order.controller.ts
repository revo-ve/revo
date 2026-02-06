// ============================================
// REVO — Order Controller (with Permissions)
// ============================================
// Location: apps/api/src/modules/order/order.controller.ts
// ============================================

import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrderService } from './order.service';
import { TenantGuard, TenantId, CurrentUser } from '../../common/guards';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('orders')
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
export class OrderController {
  constructor(private orderService: OrderService) {}

  // ─── List orders ───
  @Get()
  @RequirePermissions('orders:view')
  async getOrders(
    @TenantId() tenantId: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('tableId') tableId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('page') page?: string,
    @Query('perPage') perPage?: string,
  ) {
    const result = await this.orderService.getOrders(tenantId, {
      status,
      type,
      tableId,
      from,
      to,
      page: page ? parseInt(page) : undefined,
      perPage: perPage ? parseInt(perPage) : undefined,
    });
    return { success: true, ...result };
  }

  // ─── Active orders (for kitchen/POS view) ───
  @Get('active')
  @RequirePermissions('orders:view', 'kds:access', 'pos:access')
  async getActiveOrders(@TenantId() tenantId: string) {
    const data = await this.orderService.getActiveOrders(tenantId);
    return { success: true, data };
  }

  // ─── Daily summary (for dashboard) ───
  @Get('summary/daily')
  @RequirePermissions('dashboard:view', 'reports:view')
  async getDailySummary(
    @TenantId() tenantId: string,
    @Query('date') date?: string,
  ) {
    const data = await this.orderService.getDailySummary(tenantId, date);
    return { success: true, data };
  }

  // ─── Single order ───
  @Get(':id')
  @RequirePermissions('orders:view')
  async getOrder(@TenantId() tenantId: string, @Param('id') id: string) {
    const data = await this.orderService.getOrderById(tenantId, id);
    return { success: true, data };
  }

  // ─── Create order ───
  @Post()
  @RequirePermissions('orders:create')
  async createOrder(
    @TenantId() tenantId: string,
    @CurrentUser('sub') userId: string,
    @Body()
    body: {
      tableId?: string;
      type: string;
      notes?: string;
      items: {
        productId: string;
        quantity: number;
        modifiers?: { modifierId: string }[];
        notes?: string;
      }[];
    },
  ) {
    const data = await this.orderService.createOrder(tenantId, userId, body);
    return { success: true, data };
  }

  // ─── Add items to existing order ───
  @Post(':id/items')
  @RequirePermissions('orders:edit')
  async addItems(
    @TenantId() tenantId: string,
    @Param('id') orderId: string,
    @Body()
    body: {
      items: {
        productId: string;
        quantity: number;
        modifiers?: { modifierId: string }[];
        notes?: string;
      }[];
    },
  ) {
    const data = await this.orderService.addItems(tenantId, orderId, body.items);
    return { success: true, data };
  }

  // ─── Update order status ───
  @Patch(':id/status')
  @RequirePermissions('orders:edit')
  async updateStatus(
    @TenantId() tenantId: string,
    @Param('id') orderId: string,
    @Body() body: { status: string },
  ) {
    const data = await this.orderService.updateOrderStatus(
      tenantId,
      orderId,
      body.status,
    );
    return { success: true, data };
  }

  // ─── Update item status ───
  @Patch(':id/items/:itemId/status')
  @RequirePermissions('orders:edit', 'kds:update_status')
  async updateItemStatus(
    @TenantId() tenantId: string,
    @Param('id') orderId: string,
    @Param('itemId') itemId: string,
    @Body() body: { status: string },
  ) {
    const data = await this.orderService.updateItemStatus(
      tenantId,
      orderId,
      itemId,
      body.status,
    );
    return { success: true, data };
  }

  // ─── Pay order ───
  @Post(':id/pay')
  @RequirePermissions('pos:process_payment')
  async payOrder(
    @TenantId() tenantId: string,
    @Param('id') orderId: string,
    @Body()
    body: {
      paymentMethod: string;
      payments?: { method: string; amount: number }[];
    },
  ) {
    const data = await this.orderService.payOrder(tenantId, orderId, body);
    return { success: true, data };
  }

  // ─── Cancel order ───
  @Post(':id/cancel')
  @RequirePermissions('orders:cancel')
  async cancelOrder(
    @TenantId() tenantId: string,
    @Param('id') orderId: string,
    @Body() body: { reason?: string },
  ) {
    const data = await this.orderService.cancelOrder(
      tenantId,
      orderId,
      body.reason,
    );
    return { success: true, data };
  }
}
