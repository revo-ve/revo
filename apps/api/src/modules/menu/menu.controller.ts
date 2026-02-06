// ============================================
// REVO — Menu Controller (with Permissions)
// ============================================
// Location: apps/api/src/modules/menu/menu.controller.ts
// ============================================

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MenuService } from './menu.service';
import { TenantGuard, TenantId } from '../../common/guards';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';

@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  // ============================================
  // PUBLIC (no auth — for digital menu)
  // ============================================

  @Get('public/:slug')
  async getPublicMenu(@Param('slug') slug: string) {
    const data = await this.menuService.getPublicMenu(slug);
    return { success: true, data };
  }

  // ============================================
  // CATEGORIES (auth required)
  // ============================================

  @Get('categories')
  @UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
  @RequirePermissions('menu:view')
  async getCategories(@TenantId() tenantId: string) {
    const data = await this.menuService.getCategories(tenantId);
    return { success: true, data };
  }

  @Get('categories/:id')
  @UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
  @RequirePermissions('menu:view')
  async getCategory(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const data = await this.menuService.getCategoryById(tenantId, id);
    return { success: true, data };
  }

  @Post('categories')
  @UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
  @RequirePermissions('menu:create')
  async createCategory(
    @TenantId() tenantId: string,
    @Body() body: { name: string; description?: string; sortOrder?: number },
  ) {
    const data = await this.menuService.createCategory(tenantId, body);
    return { success: true, data };
  }

  @Put('categories/:id')
  @UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
  @RequirePermissions('menu:edit')
  async updateCategory(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    const data = await this.menuService.updateCategory(tenantId, id, body);
    return { success: true, data };
  }

  @Delete('categories/:id')
  @UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
  @RequirePermissions('menu:delete')
  async deleteCategory(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.menuService.deleteCategory(tenantId, id);
    return { success: true, message: 'Categoría eliminada' };
  }

  // ============================================
  // PRODUCTS (auth required)
  // ============================================

  @Get('products')
  @UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
  @RequirePermissions('menu:view')
  async getProducts(
    @TenantId() tenantId: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const data = await this.menuService.getProducts(tenantId, categoryId);
    return { success: true, data };
  }

  @Get('products/:id')
  @UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
  @RequirePermissions('menu:view')
  async getProduct(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const data = await this.menuService.getProductById(tenantId, id);
    return { success: true, data };
  }

  @Post('products')
  @UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
  @RequirePermissions('menu:create')
  async createProduct(
    @TenantId() tenantId: string,
    @Body()
    body: {
      categoryId: string;
      name: string;
      description?: string;
      price: number;
      priceUsd?: number;
      sortOrder?: number;
    },
  ) {
    const data = await this.menuService.createProduct(tenantId, body);
    return { success: true, data };
  }

  @Put('products/:id')
  @UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
  @RequirePermissions('menu:edit')
  async updateProduct(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body()
    body: {
      categoryId?: string;
      name?: string;
      description?: string;
      price?: number;
      priceUsd?: number;
      sortOrder?: number;
      isAvailable?: boolean;
    },
  ) {
    const data = await this.menuService.updateProduct(tenantId, id, body);
    return { success: true, data };
  }

  @Patch('products/:id/toggle-availability')
  @UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
  @RequirePermissions('menu:edit')
  async toggleAvailability(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    const data = await this.menuService.toggleProductAvailability(tenantId, id);
    return { success: true, data };
  }

  @Delete('products/:id')
  @UseGuards(AuthGuard('jwt'), TenantGuard, PermissionsGuard)
  @RequirePermissions('menu:delete')
  async deleteProduct(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ) {
    await this.menuService.deleteProduct(tenantId, id);
    return { success: true, message: 'Producto eliminado' };
  }
}
