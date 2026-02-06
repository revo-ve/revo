import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MenuService {
  constructor(private prisma: PrismaService) {}

  // ============================================
  // CATEGORIES
  // ============================================

  async getCategories(tenantId: string) {
    return this.prisma.category.findMany({
      where: { tenantId, isActive: true },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getCategoryById(tenantId: string, id: string) {
    const category = await this.prisma.category.findFirst({
      where: { id, tenantId },
      include: {
        products: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
    if (!category) throw new NotFoundException('Categoría no encontrada');
    return category;
  }

  async createCategory(
    tenantId: string,
    data: { name: string; description?: string; sortOrder?: number },
  ) {
    return this.prisma.category.create({
      data: {
        tenantId,
        name: data.name,
        description: data.description,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async updateCategory(
    tenantId: string,
    id: string,
    data: {
      name?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    },
  ) {
    await this.getCategoryById(tenantId, id);
    return this.prisma.category.update({
      where: { id },
      data,
    });
  }

  async deleteCategory(tenantId: string, id: string) {
    await this.getCategoryById(tenantId, id);
    return this.prisma.category.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ============================================
  // PRODUCTS
  // ============================================

  async getProducts(tenantId: string, categoryId?: string) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        isActive: true,
        ...(categoryId ? { categoryId } : {}),
      },
      include: { category: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getProductById(tenantId: string, id: string) {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async createProduct(
    tenantId: string,
    data: {
      categoryId: string;
      name: string;
      description?: string;
      price: number;
      priceUsd?: number;
      sortOrder?: number;
    },
  ) {
    // Verify category belongs to tenant
    await this.getCategoryById(tenantId, data.categoryId);

    return this.prisma.product.create({
      data: {
        tenantId,
        categoryId: data.categoryId,
        name: data.name,
        description: data.description,
        price: data.price,
        priceUsd: data.priceUsd,
        sortOrder: data.sortOrder ?? 0,
      },
      include: { category: true },
    });
  }

  async updateProduct(
    tenantId: string,
    id: string,
    data: {
      categoryId?: string;
      name?: string;
      description?: string;
      price?: number;
      priceUsd?: number;
      sortOrder?: number;
      isAvailable?: boolean;
      isActive?: boolean;
    },
  ) {
    await this.getProductById(tenantId, id);
    if (data.categoryId) {
      await this.getCategoryById(tenantId, data.categoryId);
    }
    return this.prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  async deleteProduct(tenantId: string, id: string) {
    await this.getProductById(tenantId, id);
    return this.prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async toggleProductAvailability(tenantId: string, id: string) {
    const product = await this.getProductById(tenantId, id);
    return this.prisma.product.update({
      where: { id },
      data: { isAvailable: !product.isAvailable },
      include: { category: true },
    });
  }

  // ============================================
  // PUBLIC MENU (for digital menu, no auth needed)
  // ============================================

  async getPublicMenu(slug: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });
    if (!tenant || !tenant.isActive) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    const categories = await this.prisma.category.findMany({
      where: { tenantId: tenant.id, isActive: true },
      include: {
        products: {
          where: { isActive: true, isAvailable: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return {
      tenant: {
        name: tenant.name,
        slug: tenant.slug,
        logo: tenant.logo,
        currency: tenant.currency,
      },
      categories,
    };
  }
}
