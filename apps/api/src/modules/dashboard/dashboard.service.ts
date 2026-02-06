import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) {}

    // ── Today's summary stats ──────────────────────────────
    async getTodayStats(tenantId: string) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        // Orders today (excluding cancelled)
        const ordersToday = await this.prisma.order.findMany({
            where: {
                tenantId,
                createdAt: { gte: startOfDay, lte: endOfDay },
                status: { not: 'CANCELLED' },
            },
            select: { total: true, status: true, paymentMethod: true },
        });

        // Revenue: only PAID orders
        const paidOrders = ordersToday.filter((o) => o.status === 'PAID');
        const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);

        // Active orders (not PAID, not CANCELLED)
        const activeOrders = ordersToday.filter(
            (o) => !['PAID', 'CANCELLED'].includes(o.status),
        );

        // Average ticket
        const avgTicket = paidOrders.length > 0 ? totalRevenue / paidOrders.length : 0;

        // Tables status
        const tables = await this.prisma.restaurantTable.groupBy({
            by: ['status'],
            where: { tenantId },
            _count: { id: true },
        });

        const tableStats = {
            total: 0,
            available: 0,
            occupied: 0,
            reserved: 0,
            cleaning: 0,
        };
        tables.forEach((t) => {
            tableStats.total += t._count.id;
            const key = t.status.toLowerCase() as keyof typeof tableStats;
            if (key in tableStats) tableStats[key] = t._count.id;
        });

        // Payment methods breakdown
        const paymentBreakdown: Record<string, number> = {};
        paidOrders.forEach((o) => {
            const method = o.paymentMethod ?? 'OTHER';
            paymentBreakdown[method] = (paymentBreakdown[method] || 0) + Number(o.total);
        });

        return {
            revenue: Math.round(totalRevenue * 100) / 100,
            ordersCount: ordersToday.length,
            paidCount: paidOrders.length,
            activeCount: activeOrders.length,
            avgTicket: Math.round(avgTicket * 100) / 100,
            tables: tableStats,
            paymentBreakdown,
        };
    }

    // ── Orders by status (for active overview) ─────────────
    async getOrdersByStatus(tenantId: string) {
        const counts = await this.prisma.order.groupBy({
            by: ['status'],
            where: {
                tenantId,
                status: { notIn: ['PAID', 'CANCELLED'] },
            },
            _count: { id: true },
        });

        const result: Record<string, number> = {
            PENDING: 0,
            CONFIRMED: 0,
            PREPARING: 0,
            READY: 0,
            SERVED: 0,
        };
        counts.forEach((c) => {
            result[c.status] = c._count.id;
        });

        return result;
    }

    // ── Sales last 7 days ──────────────────────────────────
    async getSalesLast7Days(tenantId: string) {
        const days: Array<{ date: string; revenue: number; orders: number }> = [];

        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);

            const orders = await this.prisma.order.findMany({
                where: {
                    tenantId,
                    status: 'PAID',
                    paidAt: { gte: start, lte: end },
                },
                select: { total: true },
            });

            const revenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
            days.push({
                date: start.toISOString().split('T')[0],
                revenue: Math.round(revenue * 100) / 100,
                orders: orders.length,
            });
        }

        return days;
    }

    // ── Hourly sales today ─────────────────────────────────
    async getHourlySalesToday(tenantId: string) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const orders = await this.prisma.order.findMany({
            where: {
                tenantId,
                createdAt: { gte: startOfDay },
                status: { not: 'CANCELLED' },
            },
            select: { total: true, createdAt: true },
        });

        // Group by hour (6AM to 11PM)
        const hours: Array<{ hour: number; label: string; revenue: number; orders: number }> = [];
        for (let h = 6; h <= 23; h++) {
            const hourOrders = orders.filter((o) => o.createdAt.getHours() === h);
            hours.push({
                hour: h,
                label: `${h}:00`,
                revenue: Math.round(
                    hourOrders.reduce((sum, o) => sum + Number(o.total), 0) * 100,
                ) / 100,
                orders: hourOrders.length,
            });
        }

        return hours;
    }

    // ── Top selling products ───────────────────────────────
    async getTopProducts(tenantId: string, limit = 10) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Get order items from today's non-cancelled orders
        const items = await this.prisma.orderItem.findMany({
            where: {
                order: {
                    tenantId,
                    createdAt: { gte: startOfDay },
                    status: { not: 'CANCELLED' },
                },
                status: { not: 'CANCELLED' },
            },
            select: {
                productName: true,
                quantity: true,
                unitPrice: true,
            },
        });

        // Aggregate by product name
        const productMap = new Map<string, { quantity: number; revenue: number }>();
        items.forEach((item) => {
            const existing = productMap.get(item.productName) || { quantity: 0, revenue: 0 };
            existing.quantity += item.quantity;
            existing.revenue += Number(item.unitPrice) * item.quantity;
            productMap.set(item.productName, existing);
        });

        return Array.from(productMap.entries())
            .map(([name, data]) => ({
                name,
                quantity: data.quantity,
                revenue: Math.round(data.revenue * 100) / 100,
            }))
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, limit);
    }

    // ── Recent orders ──────────────────────────────────────
    async getRecentOrders(tenantId: string, limit = 8) {
        const orders = await this.prisma.order.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            include: {
                table: { select: { number: true } },
                items: { select: { productName: true, quantity: true } },
            },
        });

        return orders.map((o) => ({
            id: o.id,
            orderNumber: o.orderNumber,
            table: o.table?.number ?? null,
            type: o.type,
            status: o.status,
            total: Number(o.total),
            itemsSummary: o.items
                .map((i) => `${i.productName}${i.quantity > 1 ? ` x${i.quantity}` : ''}`)
                .join(', '),
            createdAt: o.createdAt,
        }));
    }
}