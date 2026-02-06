// ============================================
// REVO — Reports Service
// ============================================
// Location: apps/api/src/modules/reports/reports.service.ts
// ============================================

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class ReportsService {
    constructor(private prisma: PrismaService) {}

    // ─── Sales summary for a date range ───
    async getSalesSummary(tenantId: string, from: Date, to: Date) {
        const orders = await this.prisma.order.findMany({
            where: {
                tenantId,
                status: 'PAID',
                paidAt: { gte: from, lte: to },
            },
            select: {
                total: true,
                subtotal: true,
                tax: true,
                discount: true,
                paymentMethod: true,
                type: true,
                paidAt: true,
            },
        });

        const totalSales = orders.reduce((s, o) => s + Number(o.total), 0);
        const totalSubtotal = orders.reduce((s, o) => s + Number(o.subtotal), 0);
        const totalTax = orders.reduce((s, o) => s + Number(o.tax), 0);
        const totalDiscount = orders.reduce((s, o) => s + Number(o.discount), 0);
        const avgTicket = orders.length > 0 ? totalSales / orders.length : 0;

        // By type
        const byType: Record<string, { count: number; total: number }> = {};
        for (const o of orders) {
            if (!byType[o.type]) byType[o.type] = { count: 0, total: 0 };
            byType[o.type].count++;
            byType[o.type].total += Number(o.total);
        }

        // By payment method
        const byPayment: Record<string, { count: number; total: number }> = {};
        for (const o of orders) {
            const method = o.paymentMethod || 'UNKNOWN';
            if (!byPayment[method]) byPayment[method] = { count: 0, total: 0 };
            byPayment[method].count++;
            byPayment[method].total += Number(o.total);
        }

        return {
            totalSales: Math.round(totalSales * 100) / 100,
            totalSubtotal: Math.round(totalSubtotal * 100) / 100,
            totalTax: Math.round(totalTax * 100) / 100,
            totalDiscount: Math.round(totalDiscount * 100) / 100,
            orderCount: orders.length,
            avgTicket: Math.round(avgTicket * 100) / 100,
            byType: Object.entries(byType).map(([type, data]) => ({
                type,
                count: data.count,
                total: Math.round(data.total * 100) / 100,
            })),
            byPayment: Object.entries(byPayment).map(([method, data]) => ({
                method,
                count: data.count,
                total: Math.round(data.total * 100) / 100,
            })),
        };
    }

    // ─── Sales by day (for charts) ───
    async getSalesByDay(tenantId: string, from: Date, to: Date) {
        const orders = await this.prisma.order.findMany({
            where: {
                tenantId,
                status: 'PAID',
                paidAt: { gte: from, lte: to },
            },
            select: { total: true, paidAt: true },
            orderBy: { paidAt: 'asc' },
        });

        const byDay: Record<string, { date: string; total: number; count: number }> = {};

        for (const o of orders) {
            const day = o.paidAt!.toISOString().slice(0, 10);
            if (!byDay[day]) byDay[day] = { date: day, total: 0, count: 0 };
            byDay[day].total += Number(o.total);
            byDay[day].count++;
        }

        // Fill gaps with zeros
        const result: Array<{ date: string; total: number; count: number }> = [];
        const cursor = new Date(from);
        while (cursor <= to) {
            const day = cursor.toISOString().slice(0, 10);
            result.push(byDay[day] || { date: day, total: 0, count: 0 });
            cursor.setDate(cursor.getDate() + 1);
        }

        return result.map((d) => ({
            ...d,
            total: Math.round(d.total * 100) / 100,
        }));
    }

    // ─── Sales by hour (for today or a specific day) ───
    async getSalesByHour(tenantId: string, date: Date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const orders = await this.prisma.order.findMany({
            where: {
                tenantId,
                status: 'PAID',
                paidAt: { gte: startOfDay, lte: endOfDay },
            },
            select: { total: true, paidAt: true },
        });

        const hours = Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            label: `${i.toString().padStart(2, '0')}:00`,
            total: 0,
            count: 0,
        }));

        for (const o of orders) {
            const h = o.paidAt!.getHours();
            hours[h].total += Number(o.total);
            hours[h].count++;
        }

        return hours.map((h) => ({
            ...h,
            total: Math.round(h.total * 100) / 100,
        }));
    }

    // ─── Top products ───
    async getTopProducts(tenantId: string, from: Date, to: Date, limit = 10) {
        const items = await this.prisma.orderItem.findMany({
            where: {
                order: {
                    tenantId,
                    status: 'PAID',
                    paidAt: { gte: from, lte: to },
                },
                status: { not: 'CANCELLED' },
            },
            select: {
                productName: true,
                quantity: true,
                unitPrice: true,
            },
        });

        const productMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

        for (const item of items) {
            const key = item.productName;
            if (!productMap[key]) productMap[key] = { name: key, quantity: 0, revenue: 0 };
            productMap[key].quantity += item.quantity;
            productMap[key].revenue += Number(item.unitPrice) * item.quantity;
        }

        return Object.values(productMap)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, limit)
            .map((p) => ({
                ...p,
                revenue: Math.round(p.revenue * 100) / 100,
            }));
    }

    // ─── Sales by category ───
    async getSalesByCategory(tenantId: string, from: Date, to: Date) {
        const items = await this.prisma.orderItem.findMany({
            where: {
                order: {
                    tenantId,
                    status: 'PAID',
                    paidAt: { gte: from, lte: to },
                },
                status: { not: 'CANCELLED' },
            },
            select: {
                quantity: true,
                unitPrice: true,
                product: {
                    select: {
                        category: { select: { name: true } },
                    },
                },
            },
        });

        const catMap: Record<string, { name: string; quantity: number; revenue: number }> = {};

        for (const item of items) {
            const catName = item.product.category.name;
            if (!catMap[catName]) catMap[catName] = { name: catName, quantity: 0, revenue: 0 };
            catMap[catName].quantity += item.quantity;
            catMap[catName].revenue += Number(item.unitPrice) * item.quantity;
        }

        return Object.values(catMap)
            .sort((a, b) => b.revenue - a.revenue)
            .map((c) => ({
                ...c,
                revenue: Math.round(c.revenue * 100) / 100,
            }));
    }

    // ─── Sales by waiter ───
    async getSalesByWaiter(tenantId: string, from: Date, to: Date) {
        const orders = await this.prisma.order.findMany({
            where: {
                tenantId,
                status: 'PAID',
                paidAt: { gte: from, lte: to },
            },
            select: {
                total: true,
                user: { select: { name: true } },
            },
        });

        const waiterMap: Record<string, { name: string; count: number; total: number }> = {};

        for (const o of orders) {
            const name = o.user?.name || 'Sin asignar';
            if (!waiterMap[name]) waiterMap[name] = { name, count: 0, total: 0 };
            waiterMap[name].count++;
            waiterMap[name].total += Number(o.total);
        }

        return Object.values(waiterMap)
            .sort((a, b) => b.total - a.total)
            .map((w) => ({
                ...w,
                total: Math.round(w.total * 100) / 100,
                avgTicket: Math.round((w.total / w.count) * 100) / 100,
            }));
    }

    // ─── Comparison with previous period ───
    async getComparison(tenantId: string, from: Date, to: Date) {
        const rangeMs = to.getTime() - from.getTime();
        const prevFrom = new Date(from.getTime() - rangeMs);
        const prevTo = new Date(from.getTime() - 1);

        const [current, previous] = await Promise.all([
            this.getSalesSummary(tenantId, from, to),
            this.getSalesSummary(tenantId, prevFrom, prevTo),
        ]);

        const pct = (curr: number, prev: number) =>
            prev === 0 ? (curr > 0 ? 100 : 0) : Math.round(((curr - prev) / prev) * 10000) / 100;

        return {
            current,
            previous,
            changes: {
                sales: pct(current.totalSales, previous.totalSales),
                orders: pct(current.orderCount, previous.orderCount),
                avgTicket: pct(current.avgTicket, previous.avgTicket),
            },
        };
    }
}