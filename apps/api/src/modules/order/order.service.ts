import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Prisma } from '@prisma/client';

// ---- Valid status transitions ----

const ORDER_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['CONFIRMED', 'CANCELLED'],
    CONFIRMED: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['SERVED', 'CANCELLED'],
    SERVED: ['PAID'],
    PAID: [],
    CANCELLED: [],
};

const ITEM_TRANSITIONS: Record<string, string[]> = {
    PENDING: ['PREPARING', 'CANCELLED'],
    PREPARING: ['READY', 'CANCELLED'],
    READY: ['SERVED'],
    SERVED: [],
    CANCELLED: [],
};

@Injectable()
export class OrderService {
    constructor(private prisma: PrismaService) {}

    // ============================================
    // QUERIES
    // ============================================

    async getOrders(
        tenantId: string,
        filters: {
            status?: string;
            type?: string;
            tableId?: string;
            from?: string;
            to?: string;
            page?: number;
            perPage?: number;
        },
    ) {
        const page = filters.page ?? 1;
        const perPage = filters.perPage ?? 20;
        const skip = (page - 1) * perPage;

        const where: Prisma.OrderWhereInput = {
            tenantId,
            ...(filters.status ? { status: filters.status as any } : {}),
            ...(filters.type ? { type: filters.type as any } : {}),
            ...(filters.tableId ? { tableId: filters.tableId } : {}),
            ...(filters.from || filters.to
                ? {
                    createdAt: {
                        ...(filters.from ? { gte: new Date(filters.from) } : {}),
                        ...(filters.to ? { lte: new Date(filters.to) } : {}),
                    },
                }
                : {}),
        };

        const [orders, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                include: {
                    items: true,
                    table: { select: { id: true, number: true, zoneId: true } },
                    user: { select: { id: true, name: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: perPage,
            }),
            this.prisma.order.count({ where }),
        ]);

        return {
            data: orders,
            meta: {
                total,
                page,
                perPage,
                totalPages: Math.ceil(total / perPage),
            },
        };
    }

    async getActiveOrders(tenantId: string) {
        return this.prisma.order.findMany({
            where: {
                tenantId,
                status: { notIn: ['PAID', 'CANCELLED'] },
            },
            include: {
                items: true,
                table: { select: { id: true, number: true, zoneId: true } },
                user: { select: { id: true, name: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
    }

    async getOrderById(tenantId: string, id: string) {
        const order = await this.prisma.order.findFirst({
            where: { id, tenantId },
            include: {
                items: {
                    include: {
                        product: { select: { id: true, name: true, image: true } },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                table: { select: { id: true, number: true, zoneId: true } },
                user: { select: { id: true, name: true } },
            },
        });
        if (!order) throw new NotFoundException('Pedido no encontrado');
        return order;
    }

    // ============================================
    // CREATE ORDER
    // ============================================

    async createOrder(
        tenantId: string,
        userId: string,
        data: {
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
        // Validate table if DINE_IN
        if (data.type === 'DINE_IN' && !data.tableId) {
            throw new BadRequestException(
                'Mesa requerida para pedidos en sala',
            );
        }

        if (data.tableId) {
            const table = await this.prisma.restaurantTable.findFirst({
                where: { id: data.tableId, tenantId },
            });
            if (!table) throw new NotFoundException('Mesa no encontrada');
        }

        // Fetch products and validate they belong to this tenant
        const productIds = data.items.map((i) => i.productId);
        const products = await this.prisma.product.findMany({
            where: {
                id: { in: productIds },
                tenantId,
                isActive: true,
            },
        });

        const productMap = new Map(products.map((p) => [p.id, p]));

        // Validate all products exist and are available
        for (const item of data.items) {
            const product = productMap.get(item.productId);
            if (!product) {
                throw new NotFoundException(
                    `Producto ${item.productId} no encontrado`,
                );
            }
            if (!product.isAvailable) {
                throw new BadRequestException(
                    `"${product.name}" no está disponible`,
                );
            }
        }

        // Build order items and calculate totals
        const orderItems = data.items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: product.price,
                modifiers: item.modifiers ?? Prisma.JsonNull,
                notes: item.notes,
            };
        });

        const subtotal = orderItems.reduce(
            (sum, item) =>
                sum + Number(item.unitPrice) * item.quantity,
            0,
        );
        const total = subtotal; // Tax/discount can be applied later

        // Get next order number for this tenant (atomic)
        const result = await this.prisma.$transaction(async (tx) => {
            const lastOrder = await tx.order.findFirst({
                where: { tenantId },
                orderBy: { orderNumber: 'desc' },
                select: { orderNumber: true },
            });
            const nextNumber = (lastOrder?.orderNumber ?? 0) + 1;

            const order = await tx.order.create({
                data: {
                    tenantId,
                    userId,
                    tableId: data.tableId,
                    orderNumber: nextNumber,
                    type: data.type as any,
                    notes: data.notes,
                    subtotal,
                    total,
                    items: {
                        create: orderItems,
                    },
                },
                include: {
                    items: true,
                    table: { select: { id: true, number: true, zoneId: true } },
                    user: { select: { id: true, name: true } },
                },
            });

            // Mark table as OCCUPIED
            if (data.tableId && data.type === 'DINE_IN') {
                await tx.restaurantTable.update({
                    where: { id: data.tableId },
                    data: { status: 'OCCUPIED' },
                });
            }

            return order;
        });

        return result;
    }

    // ============================================
    // ADD ITEMS TO EXISTING ORDER
    // ============================================

    async addItems(
        tenantId: string,
        orderId: string,
        items: {
            productId: string;
            quantity: number;
            modifiers?: { modifierId: string }[];
            notes?: string;
        }[],
    ) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenantId },
        });
        if (!order) throw new NotFoundException('Pedido no encontrado');

        if (['PAID', 'CANCELLED'].includes(order.status)) {
            throw new BadRequestException(
                'No se pueden agregar items a un pedido cerrado',
            );
        }

        // Fetch and validate products
        const productIds = items.map((i) => i.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds }, tenantId, isActive: true },
        });
        const productMap = new Map(products.map((p) => [p.id, p]));

        for (const item of items) {
            const product = productMap.get(item.productId);
            if (!product) {
                throw new NotFoundException(
                    `Producto ${item.productId} no encontrado`,
                );
            }
            if (!product.isAvailable) {
                throw new BadRequestException(
                    `"${product.name}" no está disponible`,
                );
            }
        }

        const newItems = items.map((item) => {
            const product = productMap.get(item.productId)!;
            return {
                orderId,
                productId: product.id,
                productName: product.name,
                quantity: item.quantity,
                unitPrice: product.price,
                modifiers: item.modifiers ?? Prisma.JsonNull,
                notes: item.notes,
            };
        });

        const addedSubtotal = newItems.reduce(
            (sum, item) => sum + Number(item.unitPrice) * item.quantity,
            0,
        );

        const result = await this.prisma.$transaction(async (tx) => {
            await tx.orderItem.createMany({ data: newItems });

            const updatedOrder = await tx.order.update({
                where: { id: orderId },
                data: {
                    subtotal: { increment: addedSubtotal },
                    total: { increment: addedSubtotal },
                },
                include: {
                    items: { orderBy: { createdAt: 'asc' } },
                    table: { select: { id: true, number: true, zoneId: true } },
                    user: { select: { id: true, name: true } },
                },
            });

            return updatedOrder;
        });

        return result;
    }

    // ============================================
    // UPDATE ORDER STATUS
    // ============================================

    async updateOrderStatus(
        tenantId: string,
        orderId: string,
        newStatus: string,
    ) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenantId },
        });
        if (!order) throw new NotFoundException('Pedido no encontrado');

        const allowed = ORDER_TRANSITIONS[order.status];
        if (!allowed?.includes(newStatus)) {
            throw new BadRequestException(
                `No se puede cambiar de "${order.status}" a "${newStatus}"`,
            );
        }

        const updated = await this.prisma.order.update({
            where: { id: orderId },
            data: { status: newStatus as any },
            include: {
                items: true,
                table: { select: { id: true, number: true, zoneId: true } },
                user: { select: { id: true, name: true } },
            },
        });

        return updated;
    }

    // ============================================
    // UPDATE ITEM STATUS
    // ============================================

    async updateItemStatus(
        tenantId: string,
        orderId: string,
        itemId: string,
        newStatus: string,
    ) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenantId },
            include: { items: true },
        });
        if (!order) throw new NotFoundException('Pedido no encontrado');

        const item = order.items.find((i) => i.id === itemId);
        if (!item) throw new NotFoundException('Item no encontrado');

        const allowed = ITEM_TRANSITIONS[item.status];
        if (!allowed?.includes(newStatus)) {
            throw new BadRequestException(
                `No se puede cambiar item de "${item.status}" a "${newStatus}"`,
            );
        }

        const updated = await this.prisma.orderItem.update({
            where: { id: itemId },
            data: { status: newStatus as any },
        });

        return updated;
    }

    // ============================================
    // PAY ORDER
    // ============================================

    async payOrder(
        tenantId: string,
        orderId: string,
        data: {
            paymentMethod: string;
            payments?: { method: string; amount: number }[];
        },
    ) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenantId },
            include: { items: true },
        });
        if (!order) throw new NotFoundException('Pedido no encontrado');

        if (order.status === 'PAID') {
            throw new ConflictException('Este pedido ya fue pagado');
        }
        if (order.status === 'CANCELLED') {
            throw new BadRequestException('No se puede pagar un pedido cancelado');
        }

        // Validate MIXED payments cover the total
        if (data.paymentMethod === 'MIXED' && data.payments) {
            const paymentTotal = data.payments.reduce(
                (sum, p) => sum + p.amount,
                0,
            );
            const orderTotal = Number(order.total);
            if (Math.abs(paymentTotal - orderTotal) > 0.01) {
                throw new BadRequestException(
                    `Los pagos ($${paymentTotal.toFixed(2)}) no cubren el total ($${orderTotal.toFixed(2)})`,
                );
            }
        }

        const result = await this.prisma.$transaction(async (tx) => {
            const paid = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'PAID',
                    paymentMethod: data.paymentMethod as any,
                    paidAt: new Date(),
                },
                include: {
                    items: true,
                    table: { select: { id: true, number: true, zoneId: true } },
                    user: { select: { id: true, name: true } },
                },
            });

            // Set table to CLEANING if DINE_IN and no other active orders on this table
            if (paid.tableId && paid.type === 'DINE_IN') {
                const otherActive = await tx.order.count({
                    where: {
                        tableId: paid.tableId,
                        id: { not: orderId },
                        status: { notIn: ['PAID', 'CANCELLED'] },
                    },
                });

                if (otherActive === 0) {
                    await tx.restaurantTable.update({
                        where: { id: paid.tableId },
                        data: { status: 'CLEANING' },
                    });
                }
            }

            return paid;
        });

        return result;
    }

    // ============================================
    // CANCEL ORDER
    // ============================================

    async cancelOrder(tenantId: string, orderId: string, reason?: string) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, tenantId },
        });
        if (!order) throw new NotFoundException('Pedido no encontrado');

        if (['PAID', 'CANCELLED'].includes(order.status)) {
            throw new BadRequestException(
                `No se puede cancelar un pedido con estado "${order.status}"`,
            );
        }

        const result = await this.prisma.$transaction(async (tx) => {
            // Cancel all pending/preparing items
            await tx.orderItem.updateMany({
                where: {
                    orderId,
                    status: { notIn: ['SERVED', 'CANCELLED'] },
                },
                data: { status: 'CANCELLED' },
            });

            const cancelled = await tx.order.update({
                where: { id: orderId },
                data: {
                    status: 'CANCELLED',
                    notes: reason
                        ? `${order.notes ? order.notes + ' | ' : ''}Cancelado: ${reason}`
                        : order.notes,
                },
                include: {
                    items: true,
                    table: { select: { id: true, number: true, zoneId: true } },
                    user: { select: { id: true, name: true } },
                },
            });

            // Free table if no other active orders
            if (cancelled.tableId) {
                const otherActive = await tx.order.count({
                    where: {
                        tableId: cancelled.tableId,
                        id: { not: orderId },
                        status: { notIn: ['PAID', 'CANCELLED'] },
                    },
                });

                if (otherActive === 0) {
                    await tx.restaurantTable.update({
                        where: { id: cancelled.tableId },
                        data: { status: 'AVAILABLE' },
                    });
                }
            }

            return cancelled;
        });

        return result;
    }

    // ============================================
    // DAILY SUMMARY (for dashboard)
    // ============================================

    async getDailySummary(tenantId: string, date?: string) {
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        const orders = await this.prisma.order.findMany({
            where: {
                tenantId,
                status: 'PAID',
                paidAt: { gte: startOfDay, lte: endOfDay },
            },
            include: { items: true },
        });

        const totalRevenue = orders.reduce(
            (sum, o) => sum + Number(o.total),
            0,
        );

        // Aggregate top products
        const productCounts = new Map<
            string,
            { productName: string; quantity: number; revenue: number }
        >();

        for (const order of orders) {
            for (const item of order.items) {
                const existing = productCounts.get(item.productName) ?? {
                    productName: item.productName,
                    quantity: 0,
                    revenue: 0,
                };
                existing.quantity += item.quantity;
                existing.revenue += Number(item.unitPrice) * item.quantity;
                productCounts.set(item.productName, existing);
            }
        }

        const topProducts = [...productCounts.values()]
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5);

        return {
            date: startOfDay.toISOString().split('T')[0],
            totalOrders: orders.length,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            averageTicket:
                orders.length > 0
                    ? Math.round((totalRevenue / orders.length) * 100) / 100
                    : 0,
            topProducts,
        };
    }
}