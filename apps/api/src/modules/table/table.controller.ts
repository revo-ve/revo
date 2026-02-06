// ============================================
// REVO — Table Controller (with Permissions)
// ============================================
// Location: apps/api/src/modules/table/table.controller.ts
// ============================================

import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TableService } from './table.service';
import { TenantGuard, TenantId } from '../../common/guards';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('tables')
@UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
export class TableController {
  constructor(private tableService: TableService) {}

  // ─── Zones ───

  @Get('zones')
  @RequirePermissions('tables:view')
  async getZones(@TenantId() tenantId: string) {
    const data = await this.tableService.getZones(tenantId);
    return { success: true, data };
  }

  @Post('zones')
  @RequirePermissions('tables:manage')
  async createZone(
    @TenantId() tenantId: string,
    @Body() body: { name: string; sortOrder?: number },
  ) {
    const data = await this.tableService.createZone(tenantId, body);
    return { success: true, data };
  }

  @Put('zones/:id')
  @RequirePermissions('tables:manage')
  async updateZone(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { name?: string; sortOrder?: number },
  ) {
    const data = await this.tableService.updateZone(tenantId, id, body);
    return { success: true, data };
  }

  @Delete('zones/:id')
  @RequirePermissions('tables:manage')
  async deleteZone(@TenantId() tenantId: string, @Param('id') id: string) {
    await this.tableService.deleteZone(tenantId, id);
    return { success: true, message: 'Zona eliminada' };
  }

  // ─── Tables ───

  @Get()
  @RequirePermissions('tables:view')
  async getTables(
    @TenantId() tenantId: string,
    @Query('zoneId') zoneId?: string,
  ) {
    const data = await this.tableService.getTables(tenantId, zoneId);
    return { success: true, data };
  }

  @Get(':id')
  @RequirePermissions('tables:view')
  async getTable(@TenantId() tenantId: string, @Param('id') id: string) {
    const data = await this.tableService.getTableById(tenantId, id);
    return { success: true, data };
  }

  @Post()
  @RequirePermissions('tables:manage')
  async createTable(
    @TenantId() tenantId: string,
    @Body() body: { zoneId?: string; number: string; capacity?: number },
  ) {
    const data = await this.tableService.createTable(tenantId, body);
    return { success: true, data };
  }

  @Put(':id')
  @RequirePermissions('tables:manage')
  async updateTable(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { zoneId?: string; number?: string; capacity?: number },
  ) {
    const data = await this.tableService.updateTable(tenantId, id, body);
    return { success: true, data };
  }

  @Patch(':id/status')
  @RequirePermissions('tables:manage')
  async updateStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    const data = await this.tableService.updateTableStatus(tenantId, id, body.status);
    return { success: true, data };
  }

  @Delete(':id')
  @RequirePermissions('tables:manage')
  async deleteTable(@TenantId() tenantId: string, @Param('id') id: string) {
    await this.tableService.deleteTable(tenantId, id);
    return { success: true, message: 'Mesa eliminada' };
  }
}
