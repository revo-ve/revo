// ============================================
// REVO — Shared Types (Node 24 compatible, no enums)
// ============================================

// ---- ENUMS as const objects ----

export const Plan = {
    FREE: 'FREE',
    STARTER: 'STARTER',
    PRO: 'PRO',
    ENTERPRISE: 'ENTERPRISE',
} as const;
export type Plan = (typeof Plan)[keyof typeof Plan];

export const TableStatus = {
    AVAILABLE: 'AVAILABLE',
    OCCUPIED: 'OCCUPIED',
    RESERVED: 'RESERVED',
    CLEANING: 'CLEANING',
} as const;
export type TableStatus = (typeof TableStatus)[keyof typeof TableStatus];

export const OrderType = {
    DINE_IN: 'DINE_IN',
    TAKEOUT: 'TAKEOUT',
    DELIVERY: 'DELIVERY',
} as const;
export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const OrderStatus = {
    PENDING: 'PENDING',
    CONFIRMED: 'CONFIRMED',
    PREPARING: 'PREPARING',
    READY: 'READY',
    SERVED: 'SERVED',
    PAID: 'PAID',
    CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ItemStatus = {
    PENDING: 'PENDING',
    PREPARING: 'PREPARING',
    READY: 'READY',
    SERVED: 'SERVED',
    CANCELLED: 'CANCELLED',
} as const;
export type ItemStatus = (typeof ItemStatus)[keyof typeof ItemStatus];

export const PaymentMethod = {
    CASH_VES: 'CASH_VES',
    CASH_USD: 'CASH_USD',
    PAGO_MOVIL: 'PAGO_MOVIL',
    ZELLE: 'ZELLE',
    TRANSFER: 'TRANSFER',
    POINT_OF_SALE: 'POINT_OF_SALE',
    MIXED: 'MIXED',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const Currency = {
    VES: 'VES',
    USD: 'USD',
} as const;
export type Currency = (typeof Currency)[keyof typeof Currency];

// ---- PERMISSIONS & ROLES ----

export interface Permission {
    id: string;
    code: string;
    name: string;
    module: string;
    description: string | null;
    sortOrder: number;
}

export interface RolePermission {
    permission: Permission;
}

export interface Role {
    id: string;
    tenantId: string;
    name: string;
    description: string | null;
    color: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    permissions?: RolePermission[];
    _count?: {
        users: number;
        permissions: number;
    };
}

export interface RoleWithPermissions extends Role {
    permissions: RolePermission[];
    permissionIds: string[];
    permissionCodes: string[];
}

// Permission codes for type safety
export const PermissionCode = {
    // Dashboard
    DASHBOARD_VIEW: 'dashboard:view',
    // Menu
    MENU_VIEW: 'menu:view',
    MENU_CREATE: 'menu:create',
    MENU_EDIT: 'menu:edit',
    MENU_DELETE: 'menu:delete',
    // Tables
    TABLES_VIEW: 'tables:view',
    TABLES_MANAGE: 'tables:manage',
    TABLES_CHANGE_STATUS: 'tables:change_status',
    // Orders
    ORDERS_VIEW: 'orders:view',
    ORDERS_CREATE: 'orders:create',
    ORDERS_EDIT: 'orders:edit',
    ORDERS_CANCEL: 'orders:cancel',
    ORDERS_CHANGE_STATUS: 'orders:change_status',
    // POS
    POS_ACCESS: 'pos:access',
    POS_PROCESS_PAYMENT: 'pos:process_payment',
    POS_APPLY_DISCOUNT: 'pos:apply_discount',
    POS_VOID_ITEM: 'pos:void_item',
    POS_OPEN_DRAWER: 'pos:open_drawer',
    POS_CASH_OPERATIONS: 'pos:cash_operations',
    // KDS
    KDS_ACCESS: 'kds:access',
    KDS_UPDATE_STATUS: 'kds:update_status',
    // Reports
    REPORTS_VIEW: 'reports:view',
    REPORTS_SALES: 'reports:sales',
    REPORTS_PRODUCTS: 'reports:products',
    REPORTS_STAFF: 'reports:staff',
    REPORTS_EXPORT: 'reports:export',
    // Inventory
    INVENTORY_VIEW: 'inventory:view',
    INVENTORY_MANAGE: 'inventory:manage',
    INVENTORY_ADJUST: 'inventory:adjust',
    INVENTORY_ALERTS: 'inventory:alerts',
    // Users
    USERS_VIEW: 'users:view',
    USERS_CREATE: 'users:create',
    USERS_EDIT: 'users:edit',
    USERS_DELETE: 'users:delete',
    USERS_ASSIGN_ROLE: 'users:assign_role',
    // Roles
    ROLES_VIEW: 'roles:view',
    ROLES_MANAGE: 'roles:manage',
    // QR
    QR_VIEW: 'qr:view',
    QR_PRINT: 'qr:print',
    QR_REGENERATE: 'qr:regenerate',
    // Settings
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_EDIT: 'settings:edit',
    SETTINGS_BILLING: 'settings:billing',
} as const;
export type PermissionCode = (typeof PermissionCode)[keyof typeof PermissionCode];

// ---- MODELS ----

export interface BaseEntity {
    id: string;
    createdAt: string;
    updatedAt: string;
}

export interface Tenant extends BaseEntity {
    name: string;
    slug: string;
    logo: string | null;
    phone: string | null;
    address: string | null;
    currency: Currency;
    timezone: string;
    plan: Plan;
    isActive: boolean;
}

export interface User extends BaseEntity {
    tenantId: string;
    email: string;
    name: string;
    phone: string | null;
    avatar: string | null;
    roleId: string;
    role: Role;
    isActive: boolean;
    lastLoginAt: string | null;
}

export interface AuthUser {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: {
        id: string;
        name: string;
        color: string;
        permissions: { code: string }[];
    };
}

export interface Category extends BaseEntity {
    tenantId: string;
    name: string;
    description: string | null;
    image: string | null;
    sortOrder: number;
    isActive: boolean;
    products?: Product[];
}

export interface Product extends BaseEntity {
    tenantId: string;
    categoryId: string;
    name: string;
    description: string | null;
    image: string | null;
    price: number;
    priceUsd: number | null;
    sortOrder: number;
    isAvailable: boolean;
    isActive: boolean;
    category?: Category;
    modifierGroups?: ProductModifierGroup[];
}

export interface ModifierGroup {
    id: string;
    tenantId: string;
    name: string;
    isRequired: boolean;
    minSelect: number;
    maxSelect: number;
    modifiers: Modifier[];
}

export interface Modifier {
    id: string;
    modifierGroupId: string;
    name: string;
    priceAdjustment: number;
    isActive: boolean;
}

export interface ProductModifierGroup {
    productId: string;
    modifierGroupId: string;
    modifierGroup: ModifierGroup;
}

export interface Zone {
    id: string;
    tenantId: string;
    name: string;
    sortOrder: number;
    tables?: Table[];
}

export interface Table {
    id: string;
    tenantId: string;
    zoneId: string | null;
    number: string;
    capacity: number;
    status: TableStatus;
    qrCode: string | null;
    zone?: Zone;
    activeOrder?: Order | null;
}

export interface Order extends BaseEntity {
    tenantId: string;
    tableId: string | null;
    userId: string | null;
    orderNumber: number;
    type: OrderType;
    status: OrderStatus;
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    currency: Currency;
    paymentMethod: PaymentMethod | null;
    paidAt: string | null;
    notes: string | null;
    items: OrderItem[];
    table?: Table;
    user?: User;
}

export interface OrderItem {
    id: string;
    orderId: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    modifiers: OrderItemModifier[] | null;
    notes: string | null;
    status: ItemStatus;
    createdAt: string;
}

export interface OrderItemModifier {
    name: string;
    price: number;
}

export interface DailySummary {
    date: string;
    totalOrders: number;
    totalRevenue: number;
    averageTicket: number;
    topProducts: { productName: string; quantity: number; revenue: number }[];
}

// ---- DTOs ----

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

export interface RegisterTenantRequest {
    tenantName: string;
    ownerName: string;
    email: string;
    password: string;
    phone?: string;
}

export interface RefreshTokenRequest {
    refreshToken: string;
}

export interface CreateCategoryRequest {
    name: string;
    description?: string;
    sortOrder?: number;
}

export interface UpdateCategoryRequest {
    name?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
}

export interface CreateProductRequest {
    categoryId: string;
    name: string;
    description?: string;
    price: number;
    priceUsd?: number;
    sortOrder?: number;
}

export interface UpdateProductRequest {
    categoryId?: string;
    name?: string;
    description?: string;
    price?: number;
    priceUsd?: number;
    sortOrder?: number;
    isAvailable?: boolean;
    isActive?: boolean;
}

export interface CreateZoneRequest {
    name: string;
    sortOrder?: number;
}

export interface CreateTableRequest {
    zoneId?: string;
    number: string;
    capacity?: number;
}

export interface CreateOrderRequest {
    tableId?: string;
    type: OrderType;
    notes?: string;
    items: CreateOrderItemRequest[];
}

export interface CreateOrderItemRequest {
    productId: string;
    quantity: number;
    modifiers?: { modifierId: string }[];
    notes?: string;
}

export interface AddOrderItemsRequest {
    items: CreateOrderItemRequest[];
}

export interface PayOrderRequest {
    paymentMethod: PaymentMethod;
    payments?: {
        method: PaymentMethod;
        amount: number;
    }[];
}

// ---- ROLE DTOs ----

export interface CreateRoleRequest {
    name: string;
    description?: string;
    color?: string;
    permissionIds: string[];
}

export interface UpdateRoleRequest {
    name?: string;
    description?: string;
    color?: string;
    permissionIds?: string[];
}

export interface CreateUserRequest {
    email: string;
    password: string;
    name: string;
    phone?: string;
    roleId: string;
}

export interface UpdateUserRequest {
    email?: string;
    name?: string;
    phone?: string;
    roleId?: string;
    isActive?: boolean;
}

// ---- API RESPONSES ----

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    meta: {
        total: number;
        page: number;
        perPage: number;
        totalPages: number;
    };
}

export interface ApiError {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
}