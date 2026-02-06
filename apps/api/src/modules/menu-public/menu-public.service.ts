// ============================================
// REVO — Public Menu Service (No Auth)
// ============================================
// Location: apps/api/src/modules/menu-public/menu-public.service.ts
// ============================================

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class MenuPublicService {
    constructor(private prisma: PrismaService) {}

    // ─── Get restaurant info by slug ───
    async getRestaurantBySlug(slug: string) {
        const tenant = await this.prisma.tenant.findFirst({
            where: { slug, isActive: true },
            select: {
                id: true,
                name: true,
                slug: true,
                logo: true,
                phone: true,
                address: true,
                currency: true,
            },
        });

        if (!tenant) throw new NotFoundException('Restaurante no encontrado');
        return tenant;
    }

    // ─── Get restaurant info by QR code ───
    async getRestaurantByQr(qrCode: string) {
        const table = await this.prisma.restaurantTable.findFirst({
            where: { qrCode },
            include: {
                tenant: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                        logo: true,
                        phone: true,
                        address: true,
                        currency: true,
                        isActive: true,
                    },
                },
                zone: { select: { name: true } },
            },
        });

        if (!table || !table.tenant.isActive) throw new NotFoundException('Mesa no encontrada');

        return {
            restaurant: {
                id: table.tenant.id,
                name: table.tenant.name,
                slug: table.tenant.slug,
                logo: table.tenant.logo,
                phone: table.tenant.phone,
                address: table.tenant.address,
                currency: table.tenant.currency,
            },
            table: {
                id: table.id,
                number: table.number,
                zone: table.zone?.name ?? null,
            },
        };
    }

    // ─── Get full menu for a tenant ───
    async getMenu(tenantId: string) {
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
                        description: true,
                        image: true,
                        price: true,
                        priceUsd: true,
                    },
                },
            },
        });

        return categories
            .filter((cat) => cat.products.length > 0)
            .map((cat) => ({
                id: cat.id,
                name: cat.name,
                description: cat.description,
                image: cat.image,
                products: cat.products.map((p) => ({
                    id: p.id,
                    name: p.name,
                    description: p.description,
                    image: p.image,
                    price: Number(p.price),
                    priceUsd: p.priceUsd ? Number(p.priceUsd) : null,
                })),
            }));
    }

    // ─── Get menu by slug (convenience) ───
    async getMenuBySlug(slug: string) {
        const restaurant = await this.getRestaurantBySlug(slug);
        const menu = await this.getMenu(restaurant.id);
        return { restaurant, menu };
    }

    // ─── Get menu by QR (convenience) ───
    async getMenuByQr(qrCode: string) {
        const data = await this.getRestaurantByQr(qrCode);
        const menu = await this.getMenu(data.restaurant.id);
        return { ...data, menu };
    }

    // ─── QR Management: list all tables with QR codes ───
    async getTablesWithQr(tenantId: string) {
        const tables = await this.prisma.restaurantTable.findMany({
            where: { tenantId },
            include: { zone: { select: { name: true } } },
            orderBy: [{ zone: { sortOrder: 'asc' } }, { number: 'asc' }],
        });

        return tables.map((t) => ({
            id: t.id,
            number: t.number,
            zone: t.zone?.name ?? 'Sin zona',
            qrCode: t.qrCode,
            status: t.status,
        }));
    }

    // ─── Regenerate QR code for a table ───
    async regenerateQr(tenantId: string, tableId: string) {
        const table = await this.prisma.restaurantTable.findFirst({
            where: { id: tableId, tenantId },
        });
        if (!table) throw new NotFoundException('Mesa no encontrada');

        // Generate a new unique code
        const newCode = `${tenantId.slice(-6)}-${tableId.slice(-6)}-${Date.now().toString(36)}`;

        const updated = await this.prisma.restaurantTable.update({
            where: { id: tableId },
            data: { qrCode: newCode },
            include: { zone: { select: { name: true } } },
        });

        return {
            id: updated.id,
            number: updated.number,
            zone: updated.zone?.name ?? 'Sin zona',
            qrCode: updated.qrCode,
        };
    }
}