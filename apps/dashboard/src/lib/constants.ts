// ============================================
// REVO — Constants & Config
// ============================================
// Location: apps/dashboard/src/lib/constants.ts
// ============================================

// ─── API ───
export const API_URL = 'http://localhost:3000/api/v1';
export const MENU_URL = 'http://localhost:5173/menu';

// ─── Colors ───
export const COLORS = {
    // Brand
    primary: '#3D4F2F',
    primaryLight: '#6B8F71',
    primaryDark: '#2A3620',

    // Accent
    accent: '#E8913A',
    accentLight: '#F5A623',

    // Semantic
    success: '#6B8F71',
    warning: '#F5A623',
    error: '#C0392B',
    info: '#3498DB',

    // Neutral
    background: '#FAF8F5',
    surface: '#FFFFFF',
    border: '#E8E4DF',
    borderLight: '#F0EDE8',

    // Text
    textPrimary: '#3D4F2F',
    textSecondary: '#666666',
    textMuted: '#999999',
    textLight: '#BBBBBB',

    // Table status
    available: '#6B8F71',
    occupied: '#E8913A',
    reserved: '#F5A623',
    cleaning: '#999999',
} as const;

// ─── Role Labels ───
export const ROLE_LABELS: Record<string, string> = {
    OWNER: 'Dueño',
    ADMIN: 'Administrador',
    MANAGER: 'Gerente',
    CASHIER: 'Cajero',
    WAITER: 'Mesero',
    KITCHEN: 'Cocina',
};

export const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    OWNER: { bg: '#3D4F2F', text: '#FFF' },
    ADMIN: { bg: '#6B8F71', text: '#FFF' },
    MANAGER: { bg: '#E8913A', text: '#FFF' },
    CASHIER: { bg: '#F5A623', text: '#FFF' },
    WAITER: { bg: '#C4B5A0', text: '#3D4F2F' },
    KITCHEN: { bg: '#D4A574', text: '#FFF' },
};

// ─── Table Status ───
export const TABLE_STATUS_LABELS: Record<string, string> = {
    AVAILABLE: 'Libre',
    OCCUPIED: 'Ocupada',
    RESERVED: 'Reservada',
    CLEANING: 'Limpieza',
};

export const TABLE_STATUS_COLORS: Record<string, string> = {
    AVAILABLE: COLORS.available,
    OCCUPIED: COLORS.occupied,
    RESERVED: COLORS.reserved,
    CLEANING: COLORS.cleaning,
};

// ─── Order Status ───
export const ORDER_STATUS_LABELS: Record<string, string> = {
    PENDING: 'Pendiente',
    CONFIRMED: 'Confirmado',
    PREPARING: 'Preparando',
    READY: 'Listo',
    SERVED: 'Servido',
    PAID: 'Pagado',
    CANCELLED: 'Cancelado',
};

export const ORDER_STATUS_COLORS: Record<string, string> = {
    PENDING: '#F5A623',
    CONFIRMED: '#3498DB',
    PREPARING: '#E8913A',
    READY: '#6B8F71',
    SERVED: '#6B8F71',
    PAID: '#3D4F2F',
    CANCELLED: '#C0392B',
};

// ─── Order Type ───
export const ORDER_TYPE_LABELS: Record<string, string> = {
    DINE_IN: 'En mesa',
    TAKEOUT: 'Para llevar',
    DELIVERY: 'Delivery',
};

export const ORDER_TYPE_ICONS: Record<string, string> = {
    DINE_IN: '🍽️',
    TAKEOUT: '🥡',
    DELIVERY: '🚗',
};

// ─── Payment Methods ───
export const PAYMENT_METHOD_LABELS: Record<string, string> = {
    CASH_VES: 'Efectivo Bs.',
    CASH_USD: 'Efectivo USD',
    PAGO_MOVIL: 'Pago Móvil',
    ZELLE: 'Zelle',
    TRANSFER: 'Transferencia',
    POINT_OF_SALE: 'Punto de venta',
    MIXED: 'Pago mixto',
};

export const PAYMENT_METHOD_ICONS: Record<string, string> = {
    CASH_VES: '💵',
    CASH_USD: '💲',
    PAGO_MOVIL: '📱',
    ZELLE: '⚡',
    TRANSFER: '🏦',
    POINT_OF_SALE: '💳',
    MIXED: '🔀',
};

// ─── Stock Movement Types ───
export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
    PURCHASE: '📦 Compra',
    SALE: '🛒 Venta',
    ADJUSTMENT: '📋 Ajuste',
    WASTE: '🗑️ Merma',
    TRANSFER: '🔄 Transferencia',
    RETURN: '↩️ Devolución',
};

export const MOVEMENT_TYPE_COLORS: Record<string, string> = {
    PURCHASE: '#6B8F71',
    SALE: '#E8913A',
    ADJUSTMENT: '#3D4F2F',
    WASTE: '#C0392B',
    TRANSFER: '#F5A623',
    RETURN: '#6B8F71',
};

// ─── Formatting ───
export const formatCurrency = (amount: number, currency = 'USD'): string => {
    if (currency === 'USD') return `$${amount.toFixed(2)}`;
    if (currency === 'VES') return `Bs. ${amount.toFixed(2)}`;
    return `${amount.toFixed(2)} ${currency}`;
};

export const formatDate = (date: string | Date): string => {
    return new Date(date).toLocaleDateString('es-VE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    });
};

export const formatTime = (date: string | Date): string => {
    return new Date(date).toLocaleTimeString('es-VE', {
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const formatDateTime = (date: string | Date): string => {
    return `${formatDate(date)} ${formatTime(date)}`;
};

export const formatRelativeTime = (date: string | Date): string => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `Hace ${diffHours}h`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;

    return formatDate(date);
};