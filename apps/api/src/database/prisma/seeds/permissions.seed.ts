// ============================================
// REVO — Permissions Seed
// ============================================
// Location: apps/api/prisma/seeds/permissions.seed.ts
// ============================================

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Catálogo completo de permisos REVO ───
export const PERMISSIONS = [
    // Dashboard
    { code: 'dashboard:view', name: 'Ver dashboard', module: 'dashboard', description: 'Acceder al dashboard y ver estadísticas', sortOrder: 1 },

    // Menú / Catálogo
    { code: 'menu:view', name: 'Ver menú', module: 'menu', description: 'Ver productos y categorías', sortOrder: 10 },
    { code: 'menu:create', name: 'Crear productos', module: 'menu', description: 'Crear nuevos productos y categorías', sortOrder: 11 },
    { code: 'menu:edit', name: 'Editar productos', module: 'menu', description: 'Modificar productos y categorías existentes', sortOrder: 12 },
    { code: 'menu:delete', name: 'Eliminar productos', module: 'menu', description: 'Eliminar productos y categorías', sortOrder: 13 },

    // Mesas
    { code: 'tables:view', name: 'Ver mesas', module: 'tables', description: 'Ver el mapa de mesas y su estado', sortOrder: 20 },
    { code: 'tables:manage', name: 'Gestionar mesas', module: 'tables', description: 'Crear, editar y eliminar mesas', sortOrder: 21 },
    { code: 'tables:change_status', name: 'Cambiar estado de mesa', module: 'tables', description: 'Ocupar, liberar o marcar mesas en limpieza', sortOrder: 22 },

    // Pedidos
    { code: 'orders:view', name: 'Ver pedidos', module: 'orders', description: 'Ver lista de pedidos', sortOrder: 30 },
    { code: 'orders:create', name: 'Crear pedidos', module: 'orders', description: 'Tomar nuevos pedidos', sortOrder: 31 },
    { code: 'orders:edit', name: 'Editar pedidos', module: 'orders', description: 'Modificar pedidos existentes', sortOrder: 32 },
    { code: 'orders:cancel', name: 'Cancelar pedidos', module: 'orders', description: 'Cancelar pedidos completos', sortOrder: 33 },
    { code: 'orders:change_status', name: 'Cambiar estado de pedido', module: 'orders', description: 'Actualizar estado del pedido (confirmar, preparar, etc.)', sortOrder: 34 },

    // POS
    { code: 'pos:access', name: 'Acceder al POS', module: 'pos', description: 'Acceder al punto de venta', sortOrder: 40 },
    { code: 'pos:process_payment', name: 'Procesar cobros', module: 'pos', description: 'Cobrar cuentas a clientes', sortOrder: 41 },
    { code: 'pos:apply_discount', name: 'Aplicar descuentos', module: 'pos', description: 'Aplicar descuentos a pedidos', sortOrder: 42 },
    { code: 'pos:void_item', name: 'Anular items', module: 'pos', description: 'Eliminar items de una cuenta', sortOrder: 43 },
    { code: 'pos:open_drawer', name: 'Abrir caja', module: 'pos', description: 'Abrir el cajón de dinero', sortOrder: 44 },
    { code: 'pos:cash_operations', name: 'Operaciones de caja', module: 'pos', description: 'Hacer retiros, ingresos y arqueos de caja', sortOrder: 45 },

    // Cocina (KDS)
    { code: 'kds:access', name: 'Acceder a cocina', module: 'kds', description: 'Ver la pantalla de cocina (KDS)', sortOrder: 50 },
    { code: 'kds:update_status', name: 'Actualizar platos', module: 'kds', description: 'Marcar platos como en preparación o listos', sortOrder: 51 },

    // Reportes
    { code: 'reports:view', name: 'Ver reportes', module: 'reports', description: 'Acceder a reportes y estadísticas', sortOrder: 60 },
    { code: 'reports:sales', name: 'Reportes de ventas', module: 'reports', description: 'Ver reportes detallados de ventas', sortOrder: 61 },
    { code: 'reports:products', name: 'Reportes de productos', module: 'reports', description: 'Ver reportes de productos más vendidos', sortOrder: 62 },
    { code: 'reports:staff', name: 'Reportes de personal', module: 'reports', description: 'Ver reportes de desempeño del equipo', sortOrder: 63 },
    { code: 'reports:export', name: 'Exportar reportes', module: 'reports', description: 'Descargar reportes en PDF o Excel', sortOrder: 64 },

    // Inventario
    { code: 'inventory:view', name: 'Ver inventario', module: 'inventory', description: 'Ver lista de ingredientes y stock', sortOrder: 70 },
    { code: 'inventory:manage', name: 'Gestionar inventario', module: 'inventory', description: 'Crear, editar y eliminar ingredientes', sortOrder: 71 },
    { code: 'inventory:adjust', name: 'Ajustar stock', module: 'inventory', description: 'Hacer ajustes manuales de inventario', sortOrder: 72 },
    { code: 'inventory:alerts', name: 'Ver alertas de stock', module: 'inventory', description: 'Ver alertas de stock bajo', sortOrder: 73 },

    // Equipo / Usuarios
    { code: 'users:view', name: 'Ver equipo', module: 'users', description: 'Ver lista de usuarios del equipo', sortOrder: 80 },
    { code: 'users:create', name: 'Crear usuarios', module: 'users', description: 'Agregar nuevos miembros al equipo', sortOrder: 81 },
    { code: 'users:edit', name: 'Editar usuarios', module: 'users', description: 'Modificar datos de usuarios', sortOrder: 82 },
    { code: 'users:delete', name: 'Eliminar usuarios', module: 'users', description: 'Desactivar o eliminar usuarios', sortOrder: 83 },
    { code: 'users:assign_role', name: 'Asignar roles', module: 'users', description: 'Cambiar el rol de un usuario', sortOrder: 84 },

    // Roles y Permisos
    { code: 'roles:view', name: 'Ver roles', module: 'roles', description: 'Ver lista de roles', sortOrder: 90 },
    { code: 'roles:manage', name: 'Gestionar roles', module: 'roles', description: 'Crear, editar y eliminar roles', sortOrder: 91 },

    // Carta Digital / QR
    { code: 'qr:view', name: 'Ver códigos QR', module: 'qr', description: 'Ver códigos QR de mesas', sortOrder: 100 },
    { code: 'qr:print', name: 'Imprimir QR', module: 'qr', description: 'Imprimir códigos QR', sortOrder: 101 },
    { code: 'qr:regenerate', name: 'Regenerar QR', module: 'qr', description: 'Generar nuevos códigos QR', sortOrder: 102 },

    // Configuración
    { code: 'settings:view', name: 'Ver configuración', module: 'settings', description: 'Ver ajustes del negocio', sortOrder: 110 },
    { code: 'settings:edit', name: 'Editar configuración', module: 'settings', description: 'Modificar ajustes del negocio', sortOrder: 111 },
    { code: 'settings:billing', name: 'Ver facturación', module: 'settings', description: 'Ver plan y facturación de REVO', sortOrder: 112 },
];

// ─── Roles predeterminados para nuevos tenants ───
export const DEFAULT_ROLES = [
    {
        name: 'Dueño',
        description: 'Control total del negocio',
        color: '#3D4F2F',
        permissions: 'ALL', // Todos los permisos
    },
    {
        name: 'Administrador',
        description: 'Gestión completa excepto facturación',
        color: '#5F7161',
        permissions: [
            'dashboard:view',
            'menu:view', 'menu:create', 'menu:edit', 'menu:delete',
            'tables:view', 'tables:manage', 'tables:change_status',
            'orders:view', 'orders:create', 'orders:edit', 'orders:cancel', 'orders:change_status',
            'pos:access', 'pos:process_payment', 'pos:apply_discount', 'pos:void_item', 'pos:open_drawer', 'pos:cash_operations',
            'kds:access', 'kds:update_status',
            'reports:view', 'reports:sales', 'reports:products', 'reports:staff', 'reports:export',
            'inventory:view', 'inventory:manage', 'inventory:adjust', 'inventory:alerts',
            'users:view', 'users:create', 'users:edit', 'users:delete', 'users:assign_role',
            'roles:view', 'roles:manage',
            'qr:view', 'qr:print', 'qr:regenerate',
            'settings:view', 'settings:edit',
        ],
    },
    {
        name: 'Gerente',
        description: 'Supervisión de operaciones diarias',
        color: '#6B8F71',
        permissions: [
            'dashboard:view',
            'menu:view', 'menu:create', 'menu:edit',
            'tables:view', 'tables:manage', 'tables:change_status',
            'orders:view', 'orders:create', 'orders:edit', 'orders:cancel', 'orders:change_status',
            'pos:access', 'pos:process_payment', 'pos:apply_discount', 'pos:void_item', 'pos:cash_operations',
            'kds:access', 'kds:update_status',
            'reports:view', 'reports:sales', 'reports:products', 'reports:staff',
            'inventory:view', 'inventory:manage', 'inventory:adjust', 'inventory:alerts',
            'users:view',
            'qr:view', 'qr:print',
        ],
    },
    {
        name: 'Cajero',
        description: 'Punto de venta y cobros',
        color: '#D4A574',
        permissions: [
            'dashboard:view',
            'menu:view',
            'tables:view', 'tables:change_status',
            'orders:view', 'orders:create', 'orders:change_status',
            'pos:access', 'pos:process_payment', 'pos:apply_discount', 'pos:open_drawer', 'pos:cash_operations',
            'qr:view',
        ],
    },
    {
        name: 'Mesero',
        description: 'Atención de mesas y pedidos',
        color: '#C8553D',
        isDefault: true, // Rol por defecto para nuevos usuarios
        permissions: [
            'menu:view',
            'tables:view', 'tables:change_status',
            'orders:view', 'orders:create', 'orders:edit',
        ],
    },
    {
        name: 'Cocina',
        description: 'Preparación de pedidos',
        color: '#8B6914',
        permissions: [
            'menu:view',
            'orders:view',
            'kds:access', 'kds:update_status',
            'inventory:view', 'inventory:alerts',
        ],
    },
];

// ─── Seed Functions ───
export async function seedPermissions() {
    console.log('🔐 Seeding permissions...');

    for (const permission of PERMISSIONS) {
        await prisma.permission.upsert({
            where: { code: permission.code },
            update: {
                name: permission.name,
                module: permission.module,
                description: permission.description,
                sortOrder: permission.sortOrder,
            },
            create: permission,
        });
    }

    console.log(`✅ ${PERMISSIONS.length} permissions seeded`);
}

export async function seedDefaultRolesForTenant(tenantId: string) {
    console.log(`👥 Creating default roles for tenant ${tenantId}...`);

    const allPermissions = await prisma.permission.findMany();
    const permissionMap = new Map(allPermissions.map(p => [p.code, p.id]));

    for (const roleDef of DEFAULT_ROLES) {
        // Check if role already exists
        const existing = await prisma.role.findUnique({
            where: { tenantId_name: { tenantId, name: roleDef.name } },
        });

        if (existing) continue;

        // Determine permissions
        let permissionIds: string[];
        if (roleDef.permissions === 'ALL') {
            permissionIds = allPermissions.map(p => p.id);
        } else {
            permissionIds = (roleDef.permissions as string[])
                .map(code => permissionMap.get(code))
                .filter((id): id is string => !!id);
        }

        // Create role with permissions
        await prisma.role.create({
            data: {
                tenantId,
                name: roleDef.name,
                description: roleDef.description,
                color: roleDef.color,
                isDefault: roleDef.isDefault || false,
                permissions: {
                    create: permissionIds.map(permissionId => ({ permissionId })),
                },
            },
        });

        console.log(`  ✓ Role "${roleDef.name}" created with ${permissionIds.length} permissions`);
    }
}

// ─── Main Seed ───
async function main() {
    await seedPermissions();

    // Seed default roles for existing tenants
    const tenants = await prisma.tenant.findMany();
    for (const tenant of tenants) {
        await seedDefaultRolesForTenant(tenant.id);
    }

    console.log('🎉 Permissions seed completed!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());