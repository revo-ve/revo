// ============================================
// REVO — Unified Database Seed
// ============================================
// Single source of truth for all demo data.
// Location: apps/api/src/database/prisma/seed.ts
// Run with: pnpm db:seed
// ============================================

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding REVO database...\n');

    // ============================================
    // CLEANUP — Orden inverso a las relaciones
    // ============================================
    await prisma.stockMovement.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.productModifierGroup.deleteMany();
    await prisma.modifier.deleteMany();
    await prisma.modifierGroup.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.restaurantTable.deleteMany();
    await prisma.zone.deleteMany();
    await prisma.refreshToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.tenant.deleteMany();
    console.log('🗑️  Cleaned existing data');

    // ============================================
    // 1. TENANT
    // ============================================
    const tenant = await prisma.tenant.create({
        data: {
            name: 'El Fogón de Luis',
            slug: 'el-fogon-de-luis',
            phone: '+58 412-555-1234',
            address: 'Av. Principal, Centro Comercial, Local 5, Caracas',
            currency: 'USD',
            timezone: 'America/Caracas',
            plan: 'PRO',
        },
    });
    console.log('✅ Tenant:', tenant.name);

    // ============================================
    // 2. USERS
    // ============================================
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    const owner = await prisma.user.create({
        data: {
            tenantId: tenant.id,
            email: 'luis@revo.com',
            password: hashedPassword,
            name: 'Luis',
            role: 'OWNER',
        },
    });

    const waiter = await prisma.user.create({
        data: {
            tenantId: tenant.id,
            email: 'carlos@revo.com',
            password: hashedPassword,
            name: 'Carlos Rodríguez',
            role: 'WAITER',
        },
    });

    const kitchenUser = await prisma.user.create({
        data: {
            tenantId: tenant.id,
            email: 'ana@revo.com',
            password: hashedPassword,
            name: 'Ana Martínez',
            role: 'KITCHEN',
        },
    });

    const cashier = await prisma.user.create({
        data: {
            tenantId: tenant.id,
            email: 'maria@revo.com',
            password: hashedPassword,
            name: 'María García',
            role: 'CASHIER',
        },
    });

    console.log('✅ Users: Owner, Waiter, Kitchen, Cashier');

    // ============================================
    // 3. CATEGORIES
    // ============================================
    const entradas = await prisma.category.create({
        data: { tenantId: tenant.id, name: 'Entradas', description: 'Para comenzar bien', sortOrder: 0 },
    });
    const platos = await prisma.category.create({
        data: { tenantId: tenant.id, name: 'Platos Principales', description: 'Lo mejor de la casa', sortOrder: 1 },
    });
    const arepas = await prisma.category.create({
        data: { tenantId: tenant.id, name: 'Arepas', description: 'Rellenas como te gustan', sortOrder: 2 },
    });
    const bebidas = await prisma.category.create({
        data: { tenantId: tenant.id, name: 'Bebidas', description: 'Refrescantes y naturales', sortOrder: 3 },
    });
    const postres = await prisma.category.create({
        data: { tenantId: tenant.id, name: 'Postres', description: 'El toque dulce', sortOrder: 4 },
    });
    const desayunos = await prisma.category.create({
        data: { tenantId: tenant.id, name: 'Desayunos', description: 'Para arrancar el día con energía', sortOrder: 5 },
    });

    console.log('✅ Categories: 6');

    // ============================================
    // 4. PRODUCTS (with inventory data)
    // ============================================
    const products = await Promise.all([
        // --- Entradas ---
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: entradas.id, name: 'Tequeños de Queso', description: 'Crujientes palitos de masa rellenos de queso blanco (6 uds)', price: 6.50, priceUsd: 6.50, sortOrder: 0, trackStock: true, currentStock: 45, minStock: 10, stockUnit: 'porción' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: entradas.id, name: 'Empanadas de Cazón', description: 'Empanadas fritas de harina de maíz con cazón guisado (3 uds)', price: 5.00, priceUsd: 5.00, sortOrder: 1, trackStock: true, currentStock: 30, minStock: 8, stockUnit: 'porción' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: entradas.id, name: 'Tostones con Guasacaca', description: 'Plátano verde frito con salsa guasacaca casera', price: 4.50, priceUsd: 4.50, sortOrder: 2, trackStock: true, currentStock: 5, minStock: 10, stockUnit: 'porción' },
        }),

        // --- Platos Principales ---
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: platos.id, name: 'Pabellón Criollo', description: 'Carne mechada, caraotas negras, arroz blanco, tajadas y huevo frito', price: 12.00, priceUsd: 12.00, sortOrder: 0, trackStock: true, currentStock: 20, minStock: 5, stockUnit: 'plato' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: platos.id, name: 'Asado Negro', description: 'Carne en salsa dulce con arroz blanco y tajadas', price: 14.00, priceUsd: 14.00, sortOrder: 1, trackStock: true, currentStock: 12, minStock: 5, stockUnit: 'plato' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: platos.id, name: 'Pollo en Brasas', description: 'Medio pollo a las brasas con ensalada y yuca frita', price: 11.00, priceUsd: 11.00, sortOrder: 2, trackStock: true, currentStock: 15, minStock: 5, stockUnit: 'plato' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: platos.id, name: 'Parrilla Mixta', description: 'Chorizo, morcilla, pollo y carne con arepa y guasacaca', price: 18.00, priceUsd: 18.00, sortOrder: 3, trackStock: true, currentStock: 8, minStock: 4, stockUnit: 'plato' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: platos.id, name: 'Cachapa con Queso de Mano', description: 'Cachapa de maíz tierno con queso telita', price: 7.00, priceUsd: 7.00, sortOrder: 4, trackStock: true, currentStock: 18, minStock: 6, stockUnit: 'unidad' },
        }),

        // --- Arepas ---
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: arepas.id, name: 'Reina Pepiada', description: 'Pollo desmechado con aguacate y mayonesa', price: 5.50, priceUsd: 5.50, sortOrder: 0, trackStock: true, currentStock: 25, minStock: 8, stockUnit: 'unidad' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: arepas.id, name: 'Dominó', description: 'Caraotas negras con queso blanco rallado', price: 4.00, priceUsd: 4.00, sortOrder: 1, trackStock: true, currentStock: 20, minStock: 8, stockUnit: 'unidad' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: arepas.id, name: 'Pelúa', description: 'Carne mechada con queso amarillo', price: 5.50, priceUsd: 5.50, sortOrder: 2, trackStock: true, currentStock: 3, minStock: 8, stockUnit: 'unidad' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: arepas.id, name: 'La del Chef', description: 'Pernil, queso de mano, aguacate y salsa de la casa', price: 7.00, priceUsd: 7.00, sortOrder: 3, trackStock: true, currentStock: 10, minStock: 5, stockUnit: 'unidad' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: arepas.id, name: 'Catira', description: 'Pollo desmenuzado y queso amarillo', price: 5.00, priceUsd: 5.00, sortOrder: 4, trackStock: true, currentStock: 22, minStock: 8, stockUnit: 'unidad' },
        }),

        // --- Bebidas (sin stock — productos de barra) ---
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: bebidas.id, name: 'Jugo de Parchita', description: 'Jugo natural de maracuyá', price: 3.00, priceUsd: 3.00, sortOrder: 0, trackStock: true, currentStock: 40, minStock: 10, stockUnit: 'vaso' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: bebidas.id, name: 'Jugo de Guanábana', description: 'Jugo natural cremoso', price: 3.00, priceUsd: 3.00, sortOrder: 1, trackStock: true, currentStock: 35, minStock: 10, stockUnit: 'vaso' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: bebidas.id, name: 'Papelón con Limón', description: 'Bebida tradicional de papelón y limón', price: 2.50, priceUsd: 2.50, sortOrder: 2, trackStock: false, currentStock: 0, minStock: 0, stockUnit: 'vaso' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: bebidas.id, name: 'Cerveza Polar', description: 'Pilsen bien fría (330ml)', price: 3.50, priceUsd: 3.50, sortOrder: 3, trackStock: true, currentStock: 48, minStock: 12, stockUnit: 'botella' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: bebidas.id, name: 'Malta Regional', description: 'Malta oscura (250ml)', price: 2.00, priceUsd: 2.00, sortOrder: 4, trackStock: true, currentStock: 24, minStock: 6, stockUnit: 'botella' },
        }),

        // --- Postres ---
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: postres.id, name: 'Quesillo', description: 'Quesillo casero tradicional', price: 4.00, priceUsd: 4.00, sortOrder: 0, trackStock: true, currentStock: 8, minStock: 3, stockUnit: 'porción' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: postres.id, name: 'Tres Leches', description: 'Torta empapada en tres leches con merengue', price: 5.00, priceUsd: 5.00, sortOrder: 1, trackStock: true, currentStock: 6, minStock: 3, stockUnit: 'porción' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: postres.id, name: 'Bienmesabe', description: 'Postre de coco rallado tradicional', price: 4.50, priceUsd: 4.50, sortOrder: 2, trackStock: true, currentStock: 0, minStock: 3, stockUnit: 'porción' },
        }),

        // --- Desayunos ---
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: desayunos.id, name: 'Empanada de Queso', description: 'Empanada frita rellena de queso blanco', price: 2.50, priceUsd: 2.50, sortOrder: 0, trackStock: true, currentStock: 15, minStock: 5, stockUnit: 'unidad' },
        }),
        prisma.product.create({
            data: { tenantId: tenant.id, categoryId: desayunos.id, name: 'Combo Mañanero', description: 'Arepa + café con leche + jugo de naranja', price: 6.00, priceUsd: 6.00, sortOrder: 1, trackStock: false, currentStock: 0, minStock: 0, stockUnit: 'combo' },
        }),
    ]);

    console.log(`✅ Products: ${products.length}`);

    // Helper para buscar productos por nombre
    const p = (name: string) => products.find((prod) => prod.name.toLowerCase().includes(name.toLowerCase()))!;

    // ============================================
    // 5. ZONES & TABLES
    // ============================================
    const salon = await prisma.zone.create({
        data: { tenantId: tenant.id, name: 'Salón Principal', sortOrder: 0 },
    });
    const terraza = await prisma.zone.create({
        data: { tenantId: tenant.id, name: 'Terraza', sortOrder: 1 },
    });
    const barra = await prisma.zone.create({
        data: { tenantId: tenant.id, name: 'Barra', sortOrder: 2 },
    });

    // Salón: S-1 a S-8
    const salonTables = [];
    for (let i = 1; i <= 8; i++) {
        const t = await prisma.restaurantTable.create({
            data: {
                tenantId: tenant.id,
                zoneId: salon.id,
                number: `S-${i}`,
                capacity: i <= 6 ? 4 : 8,
                status: 'AVAILABLE',
            },
        });
        salonTables.push(t);
    }

    // Terraza: T-1 a T-6
    const terrazaTables = [];
    for (let i = 1; i <= 6; i++) {
        const t = await prisma.restaurantTable.create({
            data: {
                tenantId: tenant.id,
                zoneId: terraza.id,
                number: `T-${i}`,
                capacity: i <= 4 ? 4 : 6,
                status: 'AVAILABLE',
            },
        });
        terrazaTables.push(t);
    }

    // Barra: B-1 a B-5
    const barraTables = [];
    for (let i = 1; i <= 5; i++) {
        const t = await prisma.restaurantTable.create({
            data: {
                tenantId: tenant.id,
                zoneId: barra.id,
                number: `B-${i}`,
                capacity: 2,
                status: 'AVAILABLE',
            },
        });
        barraTables.push(t);
    }

    console.log('✅ Zones: 3 (Salón 8, Terraza 6, Barra 5 = 19 mesas)');

    // ============================================
    // 6. ORDERS
    // ============================================
    console.log('\n🧾 Seeding orders...');

    // Helpers
    let orderCounter = 0;
    const nextOrderNum = () => ++orderCounter;
    const minsAgo = (mins: number) => new Date(Date.now() - mins * 60 * 1000);

    async function createOrder(data: {
        tableId?: string | null;
        userId: string;
        type: string;
        status: string;
        currency?: string;
        paymentMethod?: string | null;
        paidAt?: Date | null;
        notes?: string | null;
        createdAt: Date;
        items: Array<{
            productId: string;
            productName: string;
            quantity: number;
            unitPrice: number;
            notes?: string;
            status: string;
        }>;
    }) {
        const order = await prisma.order.create({
            data: {
                tenantId: tenant.id,
                tableId: data.tableId ?? null,
                userId: data.userId,
                orderNumber: nextOrderNum(),
                type: data.type as any,
                status: data.status as any,
                currency: data.currency ?? 'USD',
                paymentMethod: data.paymentMethod as any ?? null,
                paidAt: data.paidAt ?? null,
                notes: data.notes ?? null,
                subtotal: 0,
                tax: 0,
                total: 0,
                createdAt: data.createdAt,
                items: {
                    create: data.items.map((item) => ({
                        productId: item.productId,
                        productName: item.productName,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        notes: item.notes ?? null,
                        status: item.status as any,
                    })),
                },
            },
            include: { items: true },
        });

        const subtotal = order.items.reduce(
            (sum, item) => sum + Number(item.unitPrice) * item.quantity,
            0,
        );
        const tax = Math.round(subtotal * 0.16 * 100) / 100;
        const total = Math.round((subtotal + tax) * 100) / 100;

        await prisma.order.update({
            where: { id: order.id },
            data: { subtotal, tax, total },
        });

        if (
            data.tableId &&
            data.type === 'DINE_IN' &&
            !['PAID', 'CANCELLED'].includes(data.status)
        ) {
            await prisma.restaurantTable.update({
                where: { id: data.tableId },
                data: { status: 'OCCUPIED' },
            });
        }

        return order;
    }

    // ---- Pedido 1: S-1 — PENDING ----
    await createOrder({
        tableId: salonTables[0].id,
        userId: waiter.id,
        type: 'DINE_IN',
        status: 'PENDING',
        createdAt: minsAgo(2),
        items: [
            { productId: p('pabellón').id, productName: 'Pabellón Criollo', quantity: 2, unitPrice: 12.00, status: 'PENDING' },
            { productId: p('jugo de parchita').id, productName: 'Jugo de Parchita', quantity: 2, unitPrice: 3.00, status: 'PENDING', notes: 'Sin hielo' },
        ],
    });

    // ---- Pedido 2: S-4 — CONFIRMED ----
    await createOrder({
        tableId: salonTables[3].id,
        userId: waiter.id,
        type: 'DINE_IN',
        status: 'CONFIRMED',
        createdAt: minsAgo(12),
        items: [
            { productId: p('parrilla').id, productName: 'Parrilla Mixta', quantity: 1, unitPrice: 18.00, status: 'PENDING', notes: 'Término medio' },
            { productId: p('tostones').id, productName: 'Tostones con Guasacaca', quantity: 1, unitPrice: 4.50, status: 'PENDING' },
            { productId: p('cerveza').id, productName: 'Cerveza Polar', quantity: 3, unitPrice: 3.50, status: 'PENDING', notes: 'Bien frías' },
        ],
    });

    // ---- Pedido 3: S-6 — PREPARING ----
    await createOrder({
        tableId: salonTables[5].id,
        userId: waiter.id,
        type: 'DINE_IN',
        status: 'PREPARING',
        createdAt: minsAgo(20),
        items: [
            { productId: p('tequeños').id, productName: 'Tequeños de Queso', quantity: 2, unitPrice: 6.50, status: 'PREPARING' },
            { productId: p('cachapa').id, productName: 'Cachapa con Queso de Mano', quantity: 1, unitPrice: 7.00, status: 'PREPARING', notes: 'Con queso de mano extra' },
            { productId: p('jugo de guanábana').id, productName: 'Jugo de Guanábana', quantity: 3, unitPrice: 3.00, status: 'READY' },
        ],
    });

    // ---- Pedido 4: S-8 — READY ----
    await createOrder({
        tableId: salonTables[7].id,
        userId: waiter.id,
        type: 'DINE_IN',
        status: 'READY',
        createdAt: minsAgo(35),
        items: [
            { productId: p('asado').id, productName: 'Asado Negro', quantity: 2, unitPrice: 14.00, status: 'READY', notes: '1 sin tajadas' },
            { productId: p('reina').id, productName: 'Reina Pepiada', quantity: 2, unitPrice: 5.50, status: 'READY' },
            { productId: p('papelón').id, productName: 'Papelón con Limón', quantity: 4, unitPrice: 2.50, status: 'READY' },
        ],
    });

    // ---- Pedido 5: T-2 — SERVED ----
    await createOrder({
        tableId: terrazaTables[1].id,
        userId: waiter.id,
        type: 'DINE_IN',
        status: 'SERVED',
        createdAt: minsAgo(50),
        items: [
            { productId: p('pollo en brasas').id, productName: 'Pollo en Brasas', quantity: 1, unitPrice: 11.00, status: 'SERVED' },
            { productId: p('pelúa').id, productName: 'Pelúa', quantity: 2, unitPrice: 5.50, status: 'SERVED' },
            { productId: p('cerveza').id, productName: 'Cerveza Polar', quantity: 4, unitPrice: 3.50, status: 'SERVED' },
        ],
    });

    // ---- Pedido 6: TAKEOUT — PREPARING ----
    await createOrder({
        tableId: null,
        userId: cashier.id,
        type: 'TAKEOUT',
        status: 'PREPARING',
        createdAt: minsAgo(15),
        notes: 'Cliente: María González — Retira en 20 min',
        items: [
            { productId: p('pabellón').id, productName: 'Pabellón Criollo', quantity: 3, unitPrice: 12.00, status: 'PREPARING', notes: '1 sin tajada' },
            { productId: p('tequeños').id, productName: 'Tequeños de Queso', quantity: 1, unitPrice: 6.50, status: 'PREPARING' },
        ],
    });

    // ---- Pedido 7: DELIVERY — CONFIRMED ----
    await createOrder({
        tableId: null,
        userId: cashier.id,
        type: 'DELIVERY',
        status: 'CONFIRMED',
        createdAt: minsAgo(8),
        notes: 'Delivery: Av. Libertador #42, Caracas — Tel: 0412-555-6789',
        items: [
            { productId: p('catira').id, productName: 'Catira', quantity: 4, unitPrice: 5.00, status: 'PENDING' },
            { productId: p('empanadas').id, productName: 'Empanadas de Cazón', quantity: 2, unitPrice: 5.00, status: 'PENDING' },
            { productId: p('jugo de parchita').id, productName: 'Jugo de Parchita', quantity: 4, unitPrice: 3.00, status: 'PENDING' },
        ],
    });

    // ---- Pedido 8: B-3 — PAID (Pago Móvil) ----
    await createOrder({
        tableId: barraTables[2].id,
        userId: cashier.id,
        type: 'DINE_IN',
        status: 'PAID',
        paymentMethod: 'PAGO_MOVIL',
        paidAt: minsAgo(30),
        createdAt: minsAgo(90),
        items: [
            { productId: p('cerveza').id, productName: 'Cerveza Polar', quantity: 6, unitPrice: 3.50, status: 'SERVED' },
            { productId: p('tequeños').id, productName: 'Tequeños de Queso', quantity: 2, unitPrice: 6.50, status: 'SERVED' },
        ],
    });

    // ---- Pedido 9: S-3 — PAID (Zelle) ----
    await createOrder({
        tableId: salonTables[2].id,
        userId: cashier.id,
        type: 'DINE_IN',
        status: 'PAID',
        paymentMethod: 'ZELLE',
        paidAt: minsAgo(60),
        createdAt: minsAgo(120),
        items: [
            { productId: p('cachapa').id, productName: 'Cachapa con Queso de Mano', quantity: 2, unitPrice: 7.00, status: 'SERVED' },
            { productId: p('combo').id, productName: 'Combo Mañanero', quantity: 2, unitPrice: 6.00, status: 'SERVED' },
            { productId: p('jugo de guanábana').id, productName: 'Jugo de Guanábana', quantity: 2, unitPrice: 3.00, status: 'SERVED' },
        ],
    });

    // ---- Pedido 10: CANCELLED ----
    await createOrder({
        tableId: salonTables[1].id,
        userId: waiter.id,
        type: 'DINE_IN',
        status: 'CANCELLED',
        createdAt: minsAgo(75),
        notes: 'Cancelado: cliente se fue por tiempo de espera',
        items: [
            { productId: p('parrilla').id, productName: 'Parrilla Mixta', quantity: 2, unitPrice: 18.00, status: 'CANCELLED' },
            { productId: p('cerveza').id, productName: 'Cerveza Polar', quantity: 4, unitPrice: 3.50, status: 'CANCELLED' },
        ],
    });

    // Mesa T-5 reservada
    await prisma.restaurantTable.update({
        where: { id: terrazaTables[4].id },
        data: { status: 'RESERVED' },
    });

    // Mesa S-7 en limpieza
    await prisma.restaurantTable.update({
        where: { id: salonTables[6].id },
        data: { status: 'CLEANING' },
    });

    console.log(`✅ Orders: ${orderCounter}`);

    // ============================================
    // 7. STOCK MOVEMENTS (Inventory history)
    // ============================================
    console.log('\n📦 Seeding inventory movements...');

    const hoursAgo = (h: number) => new Date(Date.now() - h * 60 * 60 * 1000);

    // Helper
    async function createMovement(data: {
        productId: string;
        type: string;
        quantity: number;
        previousQty: number;
        newQty: number;
        reason?: string;
        userId?: string;
        createdAt: Date;
    }) {
        await prisma.stockMovement.create({
            data: {
                tenantId: tenant.id,
                productId: data.productId,
                type: data.type as any,
                quantity: data.quantity,
                previousQty: data.previousQty,
                newQty: data.newQty,
                reason: data.reason ?? null,
                userId: data.userId ?? null,
                createdAt: data.createdAt,
            },
        });
    }

    // Compra matutina de tequeños
    await createMovement({ productId: p('tequeños').id, type: 'PURCHASE', quantity: 50, previousQty: 10, newQty: 60, reason: 'Compra proveedor mañana', userId: owner.id, createdAt: hoursAgo(6) });
    // Ventas durante el día
    await createMovement({ productId: p('tequeños').id, type: 'SALE', quantity: 15, previousQty: 60, newQty: 45, reason: 'Ventas turno mañana', createdAt: hoursAgo(3) });

    // Compra de cervezas
    await createMovement({ productId: p('cerveza').id, type: 'PURCHASE', quantity: 72, previousQty: 0, newQty: 72, reason: 'Reposición semanal Polar', userId: owner.id, createdAt: hoursAgo(24) });
    await createMovement({ productId: p('cerveza').id, type: 'SALE', quantity: 24, previousQty: 72, newQty: 48, reason: 'Ventas del día', createdAt: hoursAgo(2) });

    // Merma de pelúa (se dañó aguacate)
    await createMovement({ productId: p('pelúa').id, type: 'WASTE', quantity: 5, previousQty: 8, newQty: 3, reason: 'Aguacate dañado', userId: kitchenUser.id, createdAt: hoursAgo(4) });

    // Ajuste de bienmesabe (inventario a 0)
    await createMovement({ productId: p('bienmesabe').id, type: 'ADJUSTMENT', quantity: 4, previousQty: 4, newQty: 0, reason: 'Conteo físico — se agotó', userId: owner.id, createdAt: hoursAgo(1) });

    // Compra de arepas reina
    await createMovement({ productId: p('reina').id, type: 'PURCHASE', quantity: 30, previousQty: 5, newQty: 35, reason: 'Compra masa y pollo', userId: owner.id, createdAt: hoursAgo(5) });
    await createMovement({ productId: p('reina').id, type: 'SALE', quantity: 10, previousQty: 35, newQty: 25, createdAt: hoursAgo(1) });

    console.log('✅ Stock movements: 7');

    // ============================================
    // SUMMARY
    // ============================================
    const lowStock = products.filter((prod) => prod.trackStock && Number(prod.currentStock) <= Number(prod.minStock));

    console.log('\n🎉 Seed complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  🏪 Restaurant: El Fogón de Luis');
    console.log('  📧 Login:      luis@revo.com');
    console.log('  🔑 Password:   Admin123!');
    console.log(`  🍽️  Products:   ${products.length}`);
    console.log('  🪑 Tables:     19');
    console.log(`  🧾 Orders:     ${orderCounter}`);
    console.log(`  📦 Tracked:    ${products.filter((p) => p.trackStock).length} products`);
    console.log(`  ⚠️  Low stock:  ${lowStock.length} alerts`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });