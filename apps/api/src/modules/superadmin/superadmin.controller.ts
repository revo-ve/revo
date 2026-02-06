// ============================================
// REVO — Super Admin Controller
// ============================================
// Location: apps/api/src/modules/superadmin/superadmin.controller.ts
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
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SuperAdminGuard } from '../../common/guards/superadmin.guard';
import { TenantsService } from './tenants.service';

@Controller('superadmin')
@UseGuards(AuthGuard('jwt'), SuperAdminGuard)
export class SuperAdminController {
  constructor(private readonly tenantsService: TenantsService) {}

  // ─── Dashboard Stats ───
  @Get('dashboard')
  getDashboardStats() {
    return this.tenantsService.getDashboardStats();
  }

  // ─── Tenants CRUD ───
  @Get('tenants')
  getAllTenants() {
    return this.tenantsService.getAllTenants();
  }

  @Get('tenants/:id')
  getTenant(@Param('id') id: string) {
    return this.tenantsService.getTenant(id);
  }

  @Post('tenants')
  createTenant(
    @Body()
    body: {
      name: string;
      slug: string;
      ownerName: string;
      ownerEmail: string;
    },
  ) {
    return this.tenantsService.createTenant(body);
  }

  @Put('tenants/:id')
  updateTenant(
    @Param('id') id: string,
    @Body() body: { name?: string; slug?: string; isActive?: boolean },
  ) {
    return this.tenantsService.updateTenant(id, body);
  }

  @Patch('tenants/:id/toggle-status')
  toggleTenantStatus(@Param('id') id: string) {
    return this.tenantsService.toggleTenantStatus(id);
  }

  @Delete('tenants/:id')
  deleteTenant(@Param('id') id: string) {
    return this.tenantsService.deleteTenant(id);
  }
}
