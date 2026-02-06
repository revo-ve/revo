// ============================================
// REVO — Inventory Service
// ============================================
// Location: apps/api/src/modules/inventory/inventory.service.ts
// ============================================

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class InventoryService {
    constructor(private prisma: PrismaService) {}

    // ─── Get all products with stock info ───
    async getInventory(tenantId: string, filters?: { category?: string; lowStock?: boolean; search?: string }) {
        const products = await this.prisma.product.findMany({
            where: {
                tenantId,
                isActive: true,
                trackStock: true,
                ...(filters?.category && { categoryId: filters.category }),
                ...(filters?.search && {
                    name: { contains: filters.search, mode: 'insensitive' as const },
                }),
            },
            include: {
                category: { select: { name: true } },
            },
            orderBy: [{ category: { sortOrder: 'asc' } }, { sortOrder: 'asc' }],
        });

        let result = products.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category.name,
            categoryId: p.categoryId,
            price: Number(p.price),
            currentStock: Number(p.currentStock),
            minStock: Number(p.minStock),
            stockUnit: p.stockUnit,
            isLowStock: Number(p.currentStock) <= Number(p.minStock),
            isOutOfStock: Number(p.currentStock) <= 0,
            isAvailable: p.isAvailable,
        }));

        if (filters?.lowStock) {
            result = result.filter((p) => p.isLowStock);
        }

        return result;
    }

    // ─── Inventory stats/dashboard ───
    async getInventoryStats(tenantId: string) {
        const products = await this.prisma.product.findMany({
            where: { tenantId, isActive: true, trackStock: true },
            select: { currentStock: true, minStock: true, price: true },
        });

        const total = products.length;
        const outOfStock = products.filter((p) => Number(p.currentStock) <= 0).length;
        const lowStock = products.filter((p) => Number(p.currentStock) > 0 && Number(p.currentStock) <= Number(p.minStock)).length;
        const healthy = total - outOfStock - lowStock;
        const totalValue = products.reduce((sum, p) => sum + Number(p.currentStock) * Number(p.price), 0);

        // Today's movements
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const todayMovements = await this.prisma.stockMovement.count({
            where: { tenantId, createdAt: { gte: startOfDay } },
        });

        return {
            totalTracked: total,
            outOfStock,
            lowStock,
            healthy,
            totalValue: Math.round(totalValue * 100) / 100,
            todayMovements,
        };
    }

    // ─── Get stock alerts (low + out of stock) ───
    async getAlerts(tenantId: string) {
        const products = await this.prisma.product.findMany({
            where: {
                tenantId,
                isActive: true,
                trackStock: true,
            },
            include: { category: { select: { name: true } } },
        });

        return products
            .filter((p) => Number(p.currentStock) <= Number(p.minStock))
            .map((p) => ({
                id: p.id,
                name: p.name,
                category: p.category.name,
                currentStock: Number(p.currentStock),
                minStock: Number(p.minStock),
                stockUnit: p.stockUnit,
                isOutOfStock: Number(p.currentStock) <= 0,
                deficit: Number(p.minStock) - Number(p.currentStock),
            }))
            .sort((a, b) => a.currentStock - b.currentStock);
    }

    // ─── Add stock (purchase/return) ───
    async addStock(
        tenantId: string,
        userId: string,
        productId: string,
        data: { quantity: number; type: 'PURCHASE' | 'RETURN'; reason?: string },
    ) {
        if (data.quantity <= 0) throw new BadRequestException('La cantidad debe ser mayor a 0');

        const product = await this.prisma.product.findFirst({
            where: { id: productId, tenantId, trackStock: true },
        });
        if (!product) throw new NotFoundException('Producto no encontrado o no tiene stock activado');

        const previousQty = Number(product.currentStock);
        const newQty = previousQty + data.quantity;

        await this.prisma.$transaction([
            this.prisma.product.update({
                where: { id: productId },
                data: { currentStock: newQty },
            }),
            this.prisma.stockMovement.create({
                data: {
                    tenantId,
                    productId,
                    type: data.type,
                    quantity: data.quantity,
                    previousQty,
                    newQty,
                    reason: data.reason ?? null,
                    userId,
                },
            }),
        ]);

        return { productId, previousQty, newQty, stockUnit: product.stockUnit };
    }

    // ─── Remove stock (sale/waste) ───
    async removeStock(
        tenantId: string,
        userId: string,
        productId: string,
        data: { quantity: number; type: 'SALE' | 'WASTE' | 'TRANSFER'; reason?: string },
    ) {
        if (data.quantity <= 0) throw new BadRequestException('La cantidad debe ser mayor a 0');

        const product = await this.prisma.product.findFirst({
            where: { id: productId, tenantId, trackStock: true },
        });
        if (!product) throw new NotFoundException('Producto no encontrado o no tiene stock activado');

        const previousQty = Number(product.currentStock);
        const newQty = Math.max(0, previousQty - data.quantity);

        await this.prisma.$transaction([
            this.prisma.product.update({
                where: { id: productId },
                data: { currentStock: newQty },
            }),
            this.prisma.stockMovement.create({
                data: {
                    tenantId,
                    productId,
                    type: data.type,
                    quantity: data.quantity,
                    previousQty,
                    newQty,
                    reason: data.reason ?? null,
                    userId,
                },
            }),
        ]);

        return { productId, previousQty, newQty, stockUnit: product.stockUnit };
    }

    // ─── Adjust stock (set to specific value) ───
    async adjustStock(
        tenantId: string,
        userId: string,
        productId: string,
        data: { newQuantity: number; reason?: string },
    ) {
        if (data.newQuantity < 0) throw new BadRequestException('La cantidad no puede ser negativa');

        const product = await this.prisma.product.findFirst({
            where: { id: productId, tenantId, trackStock: true },
        });
        if (!product) throw new NotFoundException('Producto no encontrado o no tiene stock activado');

        const previousQty = Number(product.currentStock);
        const diff = Math.abs(data.newQuantity - previousQty);

        await this.prisma.$transaction([
            this.prisma.product.update({
                where: { id: productId },
                data: { currentStock: data.newQuantity },
            }),
            this.prisma.stockMovement.create({
                data: {
                    tenantId,
                    productId,
                    type: 'ADJUSTMENT',
                    quantity: diff,
                    previousQty,
                    newQty: data.newQuantity,
                    reason: data.reason ?? `Ajuste manual: ${previousQty} → ${data.newQuantity}`,
                    userId,
                },
            }),
        ]);

        return { productId, previousQty, newQty: data.newQuantity, stockUnit: product.stockUnit };
    }

    // ─── Update stock settings (minStock, stockUnit, trackStock) ───
    async updateStockSettings(
        tenantId: string,
        productId: string,
        data: { minStock?: number; stockUnit?: string; trackStock?: boolean },
    ) {
        const product = await this.prisma.product.findFirst({
            where: { id: productId, tenantId },
        });
        if (!product) throw new NotFoundException('Producto no encontrado');

        const updated = await this.prisma.product.update({
            where: { id: productId },
            data: {
                ...(data.minStock !== undefined && { minStock: data.minStock }),
                ...(data.stockUnit !== undefined && { stockUnit: data.stockUnit }),
                ...(data.trackStock !== undefined && { trackStock: data.trackStock }),
            },
            select: { id: true, name: true, minStock: true, stockUnit: true, trackStock: true },
        });

        return {
            id: updated.id,
            name: updated.name,
            minStock: Number(updated.minStock),
            stockUnit: updated.stockUnit,
            trackStock: updated.trackStock,
        };
    }

    // ─── Movement history for a product ───
    async getMovements(tenantId: string, productId?: string, limit = 50) {
        const movements = await this.prisma.stockMovement.findMany({
            where: {
                tenantId,
                ...(productId && { productId }),
            },
            include: {
                product: { select: { name: true, stockUnit: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: limit,
        });

        return movements.map((m) => ({
            id: m.id,
            productId: m.productId,
            productName: m.product.name,
            type: m.type,
            quantity: Number(m.quantity),
            previousQty: Number(m.previousQty),
            newQty: Number(m.newQty),
            stockUnit: m.product.stockUnit,
            reason: m.reason,
            createdAt: m.createdAt,
        }));
    }
}