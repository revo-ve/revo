// ============================================
// REVO — KDS (Kitchen Display System) Service
// ============================================
// Location: apps/api/src/modules/kds/kds.service.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class KdsService {
    constructor(private prisma: PrismaService) {}

    // ─── Active orders for kitchen (PENDING, CONFIRMED, PREPARING, READY) ───
    async getKitchenOrders(tenantId: string) {
        const orders = await this.prisma.order.findMany({
            where: {
                tenantId,
                status: { in: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'] },
            },
            include: {
                table: { select: { number: true } },
                user: { select: { name: true } },
                items: {
                    where: { status: { not: 'CANCELLED' } },
                    orderBy: { createdAt: 'asc' },
                    select: {
                        id: true,
                        productName: true,
                        quantity: true,
                        notes: true,
                        status: true,
                        createdAt: true,
                    },
                },
            },
            orderBy: { createdAt: 'asc' },
        });

        return orders.map((order) => ({
            id: order.id,
            orderNumber: order.orderNumber,
            type: order.type,
            status: order.status,
            table: order.table?.number ?? null,
            waiter: order.user?.name ?? null,
            notes: order.notes,
            createdAt: order.createdAt,
            items: order.items.map((i) => ({
                id: i.id,
                name: i.productName,
                quantity: i.quantity,
                notes: i.notes,
                status: i.status,
                createdAt: i.createdAt,
            })),
        }));
    }

    // ─── Kitchen stats ───
    async getKitchenStats(tenantId: string) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const items = await this.prisma.orderItem.findMany({
            where: {
                order: { tenantId, createdAt: { gte: startOfDay } },
                status: { not: 'CANCELLED' },
            },
            select: { status: true, createdAt: true },
        });

        const pending = items.filter((i) => i.status === 'PENDING').length;
        const preparing = items.filter((i) => i.status === 'PREPARING').length;
        const ready = items.filter((i) => i.status === 'READY').length;
        const served = items.filter((i) => i.status === 'SERVED').length;

        return { pending, preparing, ready, served, total: items.length };
    }

    // ─── Advance a single item's status ───
    async advanceItemStatus(tenantId: string, itemId: string) {
        const item = await this.prisma.orderItem.findFirst({
            where: { id: itemId, order: { tenantId } },
            include: { order: { select: { id: true, tenantId: true } } },
        });

        if (!item) throw new Error('Item not found');

        const nextStatus: Record<string, string> = {
            PENDING: 'PREPARING',
            PREPARING: 'READY',
            READY: 'SERVED',
        };

        const newStatus = nextStatus[item.status];
        if (!newStatus) throw new Error(`Cannot advance from ${item.status}`);

        const updated = await this.prisma.orderItem.update({
            where: { id: itemId },
            data: { status: newStatus as any },
        });

        // Auto-advance order status based on items
        await this.syncOrderStatus(item.order.id);

        return {
            id: updated.id,
            status: updated.status,
            productName: updated.productName,
        };
    }

    // ─── Advance ALL items in an order ───
    async advanceAllItems(tenantId: string, orderId: string) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenantId },
            include: { items: { where: { status: { not: 'CANCELLED' } } } },
        });

        if (!order) throw new Error('Order not found');

        // Find the dominant status to advance from
        const statuses = order.items.map((i) => i.status);
        const hasPending = statuses.includes('PENDING');
        const hasPreparing = statuses.includes('PREPARING');
        const hasReady = statuses.includes('READY');

        let fromStatus: string;
        let toStatus: string;

        if (hasPending) {
            fromStatus = 'PENDING';
            toStatus = 'PREPARING';
        } else if (hasPreparing) {
            fromStatus = 'PREPARING';
            toStatus = 'READY';
        } else if (hasReady) {
            fromStatus = 'READY';
            toStatus = 'SERVED';
        } else {
            throw new Error('No items to advance');
        }

        await this.prisma.orderItem.updateMany({
            where: { orderId, status: fromStatus as any },
            data: { status: toStatus as any },
        });

        await this.syncOrderStatus(orderId);

        return { orderId, advancedFrom: fromStatus, advancedTo: toStatus };
    }

    // ─── Recall: move item back one status ───
    async recallItem(tenantId: string, itemId: string) {
        const item = await this.prisma.orderItem.findFirst({
            where: { id: itemId, order: { tenantId } },
            include: { order: { select: { id: true } } },
        });

        if (!item) throw new Error('Item not found');

        const prevStatus: Record<string, string> = {
            PREPARING: 'PENDING',
            READY: 'PREPARING',
            SERVED: 'READY',
        };

        const newStatus = prevStatus[item.status];
        if (!newStatus) throw new Error(`Cannot recall from ${item.status}`);

        const updated = await this.prisma.orderItem.update({
            where: { id: itemId },
            data: { status: newStatus as any },
        });

        await this.syncOrderStatus(item.order.id);

        return {
            id: updated.id,
            status: updated.status,
            productName: updated.productName,
        };
    }

    // ─── Sync order status based on its items ───
    private async syncOrderStatus(orderId: string) {
        const items = await this.prisma.orderItem.findMany({
            where: { orderId, status: { not: 'CANCELLED' } },
            select: { status: true },
        });

        if (items.length === 0) return;

        const statuses = items.map((i) => i.status);
        let orderStatus: string;

        if (statuses.every((s) => s === 'SERVED')) {
            orderStatus = 'SERVED';
        } else if (statuses.every((s) => s === 'READY' || s === 'SERVED')) {
            orderStatus = 'READY';
        } else if (statuses.some((s) => s === 'PREPARING' || s === 'READY' || s === 'SERVED')) {
            orderStatus = 'PREPARING';
        } else if (statuses.some((s) => s === 'PENDING')) {
            orderStatus = 'CONFIRMED';
        } else {
            orderStatus = 'PENDING';
        }

        await this.prisma.order.update({
            where: { id: orderId },
            data: { status: orderStatus as any },
        });
    }
}