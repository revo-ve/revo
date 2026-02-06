// ============================================
// REVO — POS Service (Fixed against schema.prisma)
// ============================================
// Location: apps/api/src/modules/pos/pos.service.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class PosService {
    constructor(private prisma: PrismaService) {}

    // ─── Products grouped by category ───
    async getProductsForPOS(tenantId: string) {
        const categories = await this.prisma.category.findMany({
            where: { tenantId, isActive: true },
            orderBy: { sortOrder: 'asc' },
            include: {
                products: {
                    where: { isAvailable: true, isActive: true },
                    orderBy: { sortOrder: 'asc' },
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        description: true,
                        image: true,
                    },
                },
            },
        });

        return categories
            .filter((cat) => cat.products.length > 0)
            .map((cat) => ({
                id: cat.id,
                name: cat.name,
                products: cat.products.map((p) => ({
                    ...p,
                    price: Number(p.price),
                })),
            }));
    }

    // ─── Tables with zone info ───
    async getTablesForPOS(tenantId: string) {
        const tables = await this.prisma.restaurantTable.findMany({
            where: { tenantId },
            include: { zone: { select: { name: true, sortOrder: true } } },
            orderBy: [{ zone: { sortOrder: 'asc' } }, { number: 'asc' }],
        });

        return tables.map((t) => ({
            id: t.id,
            number: t.number,
            zone: t.zone?.name ?? 'Sin zona',
            status: t.status,
            capacity: t.capacity,
        }));
    }

    // ─── Open orders (not PAID/CANCELLED) ───
    async getOpenOrders(tenantId: string) {
        const orders = await this.prisma.order.findMany({
            where: {
                tenantId,
                status: { notIn: ['PAID', 'CANCELLED'] },
            },
            include: {
                table: { select: { number: true } },
                items: {
                    select: {
                        id: true,
                        productName: true,
                        quantity: true,
                        unitPrice: true,
                        notes: true,
                        status: true,
                    },
                },
                user: { select: { name: true } },
            },
            orderBy: { createdAt: 'desc' },
        });

        return orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            type: order.type,
            status: order.status,
            table: order.table?.number ?? null,
            waiter: order.user?.name ?? null,
            total: Number(order.total),
            notes: order.notes,
            createdAt: order.createdAt,
            items: order.items.map((i) => ({
                id: i.id,
                name: i.productName,
                quantity: i.quantity,
                unitPrice: Number(i.unitPrice),
                notes: i.notes,
                status: i.status,
            })),
        }));
    }

    // ─── Shift stats (today) ───
    async getShiftStats(tenantId: string) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const orders = await this.prisma.order.findMany({
            where: {
                tenantId,
                createdAt: { gte: startOfDay },
                status: { not: 'CANCELLED' },
            },
            select: {
                total: true,
                status: true,
                paymentMethod: true,
            },
        });

        const paid = orders.filter((o) => o.status === 'PAID');
        const active = orders.filter((o) => o.status !== 'PAID');

        return {
            totalSales: paid.reduce((sum, o) => sum + Number(o.total), 0),
            orderCount: orders.length,
            paidCount: paid.length,
            activeCount: active.length,
            avgTicket:
                paid.length > 0
                    ? paid.reduce((sum, o) => sum + Number(o.total), 0) / paid.length
                    : 0,
        };
    }

    // ─── Create quick order ───
    async createQuickOrder(
        tenantId: string,
        userId: string,
        data: {
            type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
            tableId?: string | null;
            notes?: string | null;
            paymentMethod?: string | null;
            items: Array<{
                productId: string;
                quantity: number;
                notes?: string;
            }>;
        },
    ) {
        // Fetch product prices
        const productIds = data.items.map((i) => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds }, tenantId },
            select: { id: true, name: true, price: true },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

        // Calculate totals
        const itemsData = data.items.map((item) => {
            const product = productMap.get(item.productId);
            if (!product) throw new Error(`Product ${item.productId} not found`);
            return {
                productId: item.productId,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: Number(product.price),
                notes: item.notes ?? null,
                status: 'PENDING' as const,
            };
        });

        const subtotal = itemsData.reduce(
            (sum, i) => sum + i.unitPrice * i.quantity,
            0,
        );
        const tax = Math.round(subtotal * 0.16 * 100) / 100;
        const total = Math.round((subtotal + tax) * 100) / 100;

        // Get next order number
        const lastOrder = await this.prisma.order.findFirst({
            where: { tenantId },
            orderBy: { orderNumber: 'desc' },
            select: { orderNumber: true },
        });
        const orderNumber = (lastOrder?.orderNumber ?? 0) + 1;

        // Determine initial status
        const isPaidNow = !!data.paymentMethod;

        const order = await this.prisma.order.create({
            data: {
                tenantId,
                userId,
                tableId: data.tableId ?? null,
                orderNumber,
                type: data.type,
                status: isPaidNow ? 'PAID' : 'PENDING',
                subtotal,
                tax,
                total,
                paymentMethod: (data.paymentMethod as any) ?? null,
                paidAt: isPaidNow ? new Date() : null,
                notes: data.notes ?? null,
                items: {
                    create: itemsData,
                },
            },
            include: {
                table: { select: { number: true } },
                items: true,
            },
        });

        // Mark table as OCCUPIED if dine-in and not paid immediately
        if (data.type === 'DINE_IN' && data.tableId && !isPaidNow) {
            await this.prisma.restaurantTable.update({
                where: { id: data.tableId },
                data: { status: 'OCCUPIED' },
            });
        }

        return {
            id: order.id,
            orderNumber: order.orderNumber,
            type: order.type,
            status: order.status,
            table: order.table?.number ?? null,
            total: Number(order.total),
            items: order.items.map((i) => ({
                id: i.id,
                name: i.productName,
                quantity: i.quantity,
                unitPrice: Number(i.unitPrice),
            })),
        };
    }

    // ─── Settle (pay) an existing order ───
    async settleOrder(
        tenantId: string,
        orderId: string,
        paymentMethod: string,
    ) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenantId },
            include: { items: true },
        });

        if (!order) throw new Error('Order not found');
        if (order.status === 'PAID') throw new Error('Order already paid');
        if (order.status === 'CANCELLED') throw new Error('Order is cancelled');

        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: {
                status: 'PAID',
                paymentMethod: paymentMethod as any,
                paidAt: new Date(),
            },
            include: {
                table: { select: { number: true } },
                items: true,
            },
        });

        // Mark all items as SERVED
        await this.prisma.orderItem.updateMany({
            where: { orderId, status: { not: 'CANCELLED' } },
            data: { status: 'SERVED' },
        });

        // Free the table if dine-in
        if (updated.tableId) {
            // Check if table has other open orders
            const otherOpenOrders = await this.prisma.order.count({
                where: {
                    tableId: updated.tableId,
                    tenantId,
                    status: { notIn: ['PAID', 'CANCELLED'] },
                    id: { not: orderId },
                },
            });

            if (otherOpenOrders === 0) {
                await this.prisma.restaurantTable.update({
                    where: { id: updated.tableId },
                    data: { status: 'AVAILABLE' },
                });
            }
        }

        return {
            id: updated.id,
            orderNumber: updated.orderNumber,
            status: updated.status,
            table: updated.table?.number ?? null,
            total: Number(updated.total),
            paymentMethod: updated.paymentMethod,
            paidAt: updated.paidAt,
        };
    }
}