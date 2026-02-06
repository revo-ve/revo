// ============================================
// REVO — Orders Page (Refactored)
// ============================================
// Location: apps/dashboard/src/features/orders/OrdersPage.tsx
// ============================================

import { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    X,
    Clock,
    ChefHat,
    CheckCircle2,
    UtensilsCrossed,
    CreditCard,
    XCircle,
    ClipboardList,
    Search,
    ChevronRight,
    Minus,
    Ban,
    ArrowRight,
    Users,
    Receipt,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';

// ─── Types ───
interface OrderItem {
    id: string;
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    modifiers: any;
    notes: string | null;
    status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED' | 'CANCELLED';
    createdAt: string;
}

interface Order {
    id: string;
    orderNumber: number;
    tableId: string | null;
    type: 'DINE_IN' | 'TAKEOUT' | 'DELIVERY';
    status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'PAID' | 'CANCELLED';
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    currency: string;
    paymentMethod: string | null;
    paidAt: string | null;
    notes: string | null;
    createdAt: string;
    items: OrderItem[];
    table?: { id: string; number: string; zoneId: string } | null;
    user?: { id: string; name: string } | null;
}

interface Category {
    id: string;
    name: string;
    products: Product[];
}

interface Product {
    id: string;
    name: string;
    price: number;
    priceUsd: number | null;
    isAvailable: boolean;
    categoryId: string;
}

interface TableItem {
    id: string;
    number: string;
    status: string;
    capacity: number;
    zoneId: string | null;
}

interface Zone {
    id: string;
    name: string;
    tables: TableItem[];
}

interface CartItem {
    productId: string;
    productName: string;
    price: number;
    quantity: number;
    notes?: string;
}

// ─── Status Config ───
const ORDER_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: typeof Clock }> = {
    PENDING: { label: 'Pendiente', bg: 'bg-miel-100', text: 'text-miel-700', icon: Clock },
    CONFIRMED: { label: 'Confirmado', bg: 'bg-blue-100', text: 'text-blue-700', icon: ClipboardList },
    PREPARING: { label: 'En cocina', bg: 'bg-arcilla-100', text: 'text-arcilla-700', icon: ChefHat },
    READY: { label: 'Listo', bg: 'bg-salvia-100', text: 'text-salvia-700', icon: CheckCircle2 },
    SERVED: { label: 'Servido', bg: 'bg-oliva-100', text: 'text-oliva-700', icon: UtensilsCrossed },
    PAID: { label: 'Pagado', bg: 'bg-salvia-50', text: 'text-salvia-600', icon: CreditCard },
    CANCELLED: { label: 'Cancelado', bg: 'bg-oliva-100', text: 'text-oliva-500', icon: XCircle },
};

const ITEM_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    PENDING: { label: 'Pendiente', bg: 'bg-miel-50', text: 'text-miel-700' },
    PREPARING: { label: 'En cocina', bg: 'bg-arcilla-50', text: 'text-arcilla-700' },
    READY: { label: 'Listo', bg: 'bg-salvia-50', text: 'text-salvia-700' },
    SERVED: { label: 'Servido', bg: 'bg-oliva-50', text: 'text-oliva-600' },
    CANCELLED: { label: 'Cancelado', bg: 'bg-oliva-50', text: 'text-oliva-400' },
};

const NEXT_ORDER_STATUS: Record<string, string> = {
    PENDING: 'CONFIRMED',
    CONFIRMED: 'PREPARING',
    PREPARING: 'READY',
    READY: 'SERVED',
};

const NEXT_ITEM_STATUS: Record<string, string> = {
    PENDING: 'PREPARING',
    PREPARING: 'READY',
    READY: 'SERVED',
};

const PAYMENT_METHODS = [
    { value: 'CASH_USD', label: 'Efectivo USD', icon: '💵' },
    { value: 'CASH_VES', label: 'Efectivo Bs', icon: '💴' },
    { value: 'PAGO_MOVIL', label: 'Pago Móvil', icon: '📱' },
    { value: 'ZELLE', label: 'Zelle', icon: '⚡' },
    { value: 'TRANSFER', label: 'Transferencia', icon: '🏦' },
    { value: 'POINT_OF_SALE', label: 'Punto de Venta', icon: '💳' },
    { value: 'MIXED', label: 'Mixto', icon: '🔀' },
];

const ORDER_TYPE_LABELS: Record<string, string> = {
    DINE_IN: 'En sala',
    TAKEOUT: 'Para llevar',
    DELIVERY: 'Delivery',
};

// ─── Helper ───
function getElapsedTime(createdAt: string): string {
    const diff = Date.now() - new Date(createdAt).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Ahora';
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
}

// ─── Modal Component ───
function Modal({
                   isOpen,
                   onClose,
                   title,
                   children,
                   wide,
               }: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    wide?: boolean;
}) {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-bark/40 backdrop-blur-sm" onClick={onClose} />
            <div
                className={`relative bg-white rounded-revo-lg shadow-revo-lg mx-4 p-6 animate-modal-in max-h-[90vh] overflow-y-auto ${
                    wide ? 'w-full max-w-3xl' : 'w-full max-w-md'
                }`}
            >
                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-heading font-bold text-bark">{title}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-sand transition-colors">
                        <X size={18} className="text-oliva-500" />
                    </button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ─── Order Card ───
function OrderCard({
                       order,
                       onAdvance,
                       onViewDetails,
                   }: {
    order: Order;
    onAdvance: () => void;
    onViewDetails: () => void;
}) {
    const config = ORDER_STATUS_CONFIG[order.status];
    const Icon = config.icon;
    const nextStatus = NEXT_ORDER_STATUS[order.status];
    const nextLabel = nextStatus ? ORDER_STATUS_CONFIG[nextStatus]?.label : null;
    const elapsed = getElapsedTime(order.createdAt);

    return (
        <div className="card-hover cursor-pointer group" onClick={onViewDetails}>
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <span className="font-heading font-bold text-lg text-bark">#{order.orderNumber}</span>
                    {order.table && (
                        <span className="badge bg-oliva-100 text-oliva-600">Mesa {order.table.number}</span>
                    )}
                    <span className="text-xs font-ui text-oliva-400">{ORDER_TYPE_LABELS[order.type]}</span>
                </div>
                <div className={`badge ${config.bg} ${config.text}`}>
                    <Icon size={12} className="mr-1" />
                    {config.label}
                </div>
            </div>

            {/* Items summary */}
            <div className="space-y-1 mb-3">
                {(order.items || []).slice(0, 3).map((item) => {
                    const itemConf = ITEM_STATUS_CONFIG[item.status];
                    return (
                        <div key={item.id} className="flex items-center justify-between text-sm">
              <span className="font-body text-bark truncate flex-1">
                {item.quantity}x {item.productName}
              </span>
                            <span className={`badge text-[10px] ml-2 ${itemConf.bg} ${itemConf.text}`}>
                {itemConf.label}
              </span>
                        </div>
                    );
                })}
                {order.items?.length > 3 && (
                    <p className="text-xs text-oliva-400 font-ui">+{order.items.length - 3} más...</p>
                )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-sand">
                <div className="flex items-center gap-3">
                    <span className="font-ui font-bold text-arcilla-500">${Number(order.total).toFixed(2)}</span>
                    <span className="text-xs text-oliva-400 font-ui flex items-center gap-1">
            <Clock size={11} />
                        {elapsed}
          </span>
                </div>
                {nextLabel && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAdvance();
                        }}
                        className="btn btn-ghost text-xs !px-3 !py-1.5"
                    >
                        <ArrowRight size={14} />
                        {nextLabel}
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Create Order Modal ───
function CreateOrderModal({
                              isOpen,
                              onClose,
                              categories,
                              zones,
                              onCreated,
                          }: {
    isOpen: boolean;
    onClose: () => void;
    categories: Category[];
    zones: Zone[];
    onCreated: () => void;
}) {
    const [orderType, setOrderType] = useState<string>('DINE_IN');
    const [selectedTableId, setSelectedTableId] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [notes, setNotes] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const [activeCategory, setActiveCategory] = useState<string>('');

    const { post } = useApi();
    const { success, error } = useToast();

    useEffect(() => {
        if (isOpen) {
            setOrderType('DINE_IN');
            setSelectedTableId('');
            setCart([]);
            setNotes('');
            setSearchQuery('');
            setSaving(false);
            setActiveCategory(categories[0]?.id ?? '');
        }
    }, [isOpen, categories]);

    const allProducts = useMemo(
        () => categories.flatMap((c) => (c.products || []).filter((p) => p.isAvailable)),
        [categories]
    );

    const filteredProducts = useMemo(() => {
        let products = activeCategory
            ? allProducts.filter((p) => p.categoryId === activeCategory)
            : allProducts;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            products = allProducts.filter((p) => p.name.toLowerCase().includes(q));
        }
        return products;
    }, [allProducts, activeCategory, searchQuery]);

    const availableTables = useMemo(
        () => zones.flatMap((z) => (z.tables || []).filter((t) => t.status === 'AVAILABLE' || t.status === 'OCCUPIED')),
        [zones]
    );

    const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);

    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.productId === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { productId: product.id, productName: product.name, price: product.price, quantity: 1 }];
        });
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + delta } : i))
                .filter((i) => i.quantity > 0)
        );
    };

    const handleCreate = async () => {
        if (cart.length === 0) return;
        setSaving(true);
        try {
            await post('/orders', {
                type: orderType,
                tableId: orderType === 'DINE_IN' ? selectedTableId : undefined,
                notes: notes || undefined,
                items: cart.map((i) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    notes: i.notes,
                })),
            });
            success('Pedido creado correctamente');
            onCreated();
            onClose();
        } catch (err: any) {
            error(err?.message || 'Error creando pedido');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-bark/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-white rounded-revo-lg shadow-revo-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col animate-modal-in">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-sand">
                    <h2 className="text-lg font-heading font-bold text-bark">Nuevo pedido</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-sand transition-colors">
                        <X size={18} className="text-oliva-500" />
                    </button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Product selection */}
                    <div className="flex-1 overflow-y-auto p-5 border-r border-sand">
                        {/* Type buttons */}
                        <div className="flex gap-3 mb-4">
                            {['DINE_IN', 'TAKEOUT', 'DELIVERY'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setOrderType(t)}
                                    className={`btn text-xs !px-4 !py-2 ${orderType === t ? 'btn-primary' : 'btn-outline'}`}
                                >
                                    {ORDER_TYPE_LABELS[t]}
                                </button>
                            ))}
                        </div>

                        {orderType === 'DINE_IN' && (
                            <div className="mb-4">
                                <label className="label">Mesa</label>
                                <select
                                    className="input"
                                    value={selectedTableId}
                                    onChange={(e) => setSelectedTableId(e.target.value)}
                                >
                                    <option value="">Seleccionar mesa...</option>
                                    {availableTables.map((t) => (
                                        <option key={t.id} value={t.id}>
                                            Mesa {t.number} ({t.status === 'OCCUPIED' ? 'Ocupada' : 'Libre'} · {t.capacity}p)
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Search */}
                        <div className="relative mb-4">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-oliva-400" />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    if (e.target.value) setActiveCategory('');
                                }}
                                className="input pl-9 !py-2 text-sm"
                            />
                        </div>

                        {/* Category tabs */}
                        {!searchQuery && (
                            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 hide-scrollbar">
                                {categories.map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => setActiveCategory(cat.id)}
                                        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-ui font-semibold transition-colors ${
                                            activeCategory === cat.id
                                                ? 'bg-arcilla-500 text-white'
                                                : 'bg-sand text-oliva-600 hover:bg-oliva-100'
                                        }`}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Products grid */}
                        <div className="grid grid-cols-2 gap-2">
                            {filteredProducts.map((product) => {
                                const inCart = cart.find((i) => i.productId === product.id);
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className={`text-left p-3 rounded-revo-sm border transition-all ${
                                            inCart
                                                ? 'border-arcilla-300 bg-arcilla-50'
                                                : 'border-oliva-100 hover:border-arcilla-200 hover:bg-sand/50'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between">
                      <span className="font-ui font-semibold text-sm text-bark line-clamp-1">
                        {product.name}
                      </span>
                                            {inCart && (
                                                <span className="badge bg-arcilla-500 text-white text-[10px] ml-1">
                          {inCart.quantity}
                        </span>
                                            )}
                                        </div>
                                        <span className="text-sm font-ui font-bold text-arcilla-500 mt-1 block">
                      ${Number(product.price).toFixed(2)}
                    </span>
                                    </button>
                                );
                            })}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-8 text-oliva-400 text-sm">No hay productos disponibles</div>
                        )}
                    </div>

                    {/* Right: Cart */}
                    <div className="w-80 flex flex-col bg-cream/50">
                        <div className="px-4 py-3 border-b border-sand">
                            <h3 className="font-heading font-semibold text-bark text-sm">
                                Pedido ({cart.reduce((s, i) => s + i.quantity, 0)} items)
                            </h3>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-2">
                            {cart.length === 0 ? (
                                <div className="text-center py-8">
                                    <Receipt size={32} className="mx-auto text-oliva-300 mb-2" />
                                    <p className="text-sm text-oliva-400">Agrega productos</p>
                                </div>
                            ) : (
                                cart.map((item) => (
                                    <div key={item.productId} className="bg-white rounded-revo-sm p-3 shadow-sm">
                                        <div className="flex items-start justify-between mb-2">
                                            <span className="font-ui font-semibold text-sm text-bark flex-1">{item.productName}</span>
                                            <span className="text-sm font-ui font-bold text-arcilla-500 ml-2">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => updateQuantity(item.productId, -1)}
                                                className="w-7 h-7 rounded-full bg-sand flex items-center justify-center hover:bg-oliva-100 transition-colors"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="font-ui font-semibold text-sm w-6 text-center">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.productId, 1)}
                                                className="w-7 h-7 rounded-full bg-sand flex items-center justify-center hover:bg-oliva-100 transition-colors"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Notes */}
                        {cart.length > 0 && (
                            <div className="px-4 pb-2">
                                <input
                                    className="input !py-2 text-xs"
                                    placeholder="Notas del pedido..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                />
                            </div>
                        )}

                        {/* Footer */}
                        <div className="px-4 py-4 border-t border-sand bg-white">
                            <div className="flex items-center justify-between mb-3">
                                <span className="font-ui font-semibold text-bark">Total</span>
                                <span className="font-heading font-bold text-xl text-arcilla-500">${cartTotal.toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleCreate}
                                disabled={cart.length === 0 || saving || (orderType === 'DINE_IN' && !selectedTableId)}
                                className="btn btn-primary w-full"
                            >
                                {saving ? 'Creando...' : 'Crear pedido'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Order Detail Modal ───
function OrderDetailModal({
                              isOpen,
                              onClose,
                              order,
                              onRefresh,
                          }: {
    isOpen: boolean;
    onClose: () => void;
    order: Order | null;
    onRefresh: () => void;
}) {
    const [showPayModal, setShowPayModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [selectedPayment, setSelectedPayment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    const { patch, post } = useApi();
    const { success, error } = useToast();

    if (!isOpen || !order) return null;

    const config = ORDER_STATUS_CONFIG[order.status];
    const Icon = config.icon;
    const nextStatus = NEXT_ORDER_STATUS[order.status];
    const nextLabel = nextStatus ? ORDER_STATUS_CONFIG[nextStatus]?.label : null;
    const canPay = order.status === 'SERVED';
    const canCancel = !['PAID', 'CANCELLED'].includes(order.status);

    const advanceOrder = async () => {
        if (!nextStatus) return;
        setActionLoading(true);
        try {
            await patch(`/orders/${order.id}/status`, { status: nextStatus });
            success(`Pedido movido a ${ORDER_STATUS_CONFIG[nextStatus].label}`);
            onRefresh();
        } catch (err: any) {
            error(err?.message || 'Error actualizando estado');
        } finally {
            setActionLoading(false);
        }
    };

    const advanceItem = async (itemId: string, currentStatus: string) => {
        const next = NEXT_ITEM_STATUS[currentStatus];
        if (!next) return;
        setActionLoading(true);
        try {
            await patch(`/orders/${order.id}/items/${itemId}/status`, { status: next });
            success(`Item movido a ${ITEM_STATUS_CONFIG[next].label}`);
            onRefresh();
        } catch (err: any) {
            error(err?.message || 'Error actualizando item');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePay = async () => {
        if (!selectedPayment) return;
        setActionLoading(true);
        try {
            await post(`/orders/${order.id}/pay`, { paymentMethod: selectedPayment });
            success('Pago procesado correctamente');
            setShowPayModal(false);
            onRefresh();
        } catch (err: any) {
            error(err?.message || 'Error procesando pago');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        setActionLoading(true);
        try {
            await post(`/orders/${order.id}/cancel`, { reason: cancelReason || undefined });
            success('Pedido cancelado');
            setShowCancelModal(false);
            onRefresh();
        } catch (err: any) {
            error(err?.message || 'Error cancelando pedido');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Pedido #${order.orderNumber}`} wide>
                {/* Status header */}
                <div className="flex items-center justify-between mb-5 pb-4 border-b border-sand">
                    <div className="flex items-center gap-3">
                        <div className={`badge ${config.bg} ${config.text} text-sm !px-3 !py-1`}>
                            <Icon size={14} className="mr-1.5" />
                            {config.label}
                        </div>
                        {order.table && (
                            <span className="badge bg-oliva-100 text-oliva-600">
                <Users size={12} className="mr-1" />
                Mesa {order.table.number}
              </span>
                        )}
                        <span className="text-xs text-oliva-400 font-ui">
              {ORDER_TYPE_LABELS[order.type]} ·{' '}
                            {new Date(order.createdAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
            </span>
                    </div>
                    {order.user && <span className="text-xs text-oliva-500 font-ui">por {order.user.name}</span>}
                </div>

                {/* Items */}
                <div className="space-y-2 mb-5">
                    <h3 className="text-sm font-ui font-semibold text-oliva-600 mb-2">Productos</h3>
                    {(order.items || []).map((item) => {
                        const itemConf = ITEM_STATUS_CONFIG[item.status];
                        const itemNext = NEXT_ITEM_STATUS[item.status];
                        return (
                            <div
                                key={item.id}
                                className={`flex items-center justify-between p-3 rounded-revo-sm border border-sand transition-opacity ${
                                    item.status === 'CANCELLED' ? 'opacity-40 line-through' : ''
                                }`}
                            >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <span className="font-heading font-bold text-bark text-sm w-6 text-center">{item.quantity}x</span>
                                    <div className="flex-1 min-w-0">
                                        <span className="font-ui font-semibold text-sm text-bark block truncate">{item.productName}</span>
                                        {item.notes && <span className="text-xs text-oliva-400 block">{item.notes}</span>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-ui font-bold text-oliva-600">
                    ${(Number(item.unitPrice) * item.quantity).toFixed(2)}
                  </span>
                                    <span className={`badge text-[10px] ${itemConf.bg} ${itemConf.text}`}>{itemConf.label}</span>
                                    {itemNext && !['PAID', 'CANCELLED'].includes(order.status) && (
                                        <button
                                            onClick={() => advanceItem(item.id, item.status)}
                                            disabled={actionLoading}
                                            className="p-1 rounded-revo-sm hover:bg-sand transition-colors"
                                            title={`Mover a ${ITEM_STATUS_CONFIG[itemNext].label}`}
                                        >
                                            <ChevronRight size={14} className="text-arcilla-500" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Order notes */}
                {order.notes && (
                    <div className="mb-5 px-3 py-2 rounded-revo-sm bg-miel-50 border border-miel-200 text-sm text-miel-700 font-body">
                        📝 {order.notes}
                    </div>
                )}

                {/* Totals */}
                <div className="border-t border-sand pt-4 mb-5">
                    <div className="flex justify-between text-sm font-body text-oliva-500 mb-1">
                        <span>Subtotal</span>
                        <span>${Number(order.subtotal).toFixed(2)}</span>
                    </div>
                    {Number(order.tax) > 0 && (
                        <div className="flex justify-between text-sm font-body text-oliva-500 mb-1">
                            <span>Impuesto</span>
                            <span>${Number(order.tax).toFixed(2)}</span>
                        </div>
                    )}
                    {Number(order.discount) > 0 && (
                        <div className="flex justify-between text-sm font-body text-salvia-600 mb-1">
                            <span>Descuento</span>
                            <span>-${Number(order.discount).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-heading font-bold text-lg text-bark mt-2 pt-2 border-t border-sand">
                        <span>Total</span>
                        <span className="text-arcilla-500">${Number(order.total).toFixed(2)}</span>
                    </div>
                    {order.paymentMethod && (
                        <div className="flex justify-between text-xs text-oliva-400 font-ui mt-1">
                            <span>Método de pago</span>
                            <span>{PAYMENT_METHODS.find((p) => p.value === order.paymentMethod)?.label ?? order.paymentMethod}</span>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    {canCancel && (
                        <button
                            onClick={() => setShowCancelModal(true)}
                            className="btn btn-outline !border-arcilla-200 !text-arcilla-500 hover:!bg-arcilla-50 flex-1"
                        >
                            <Ban size={16} />
                            Cancelar
                        </button>
                    )}
                    {nextLabel && (
                        <button onClick={advanceOrder} disabled={actionLoading} className="btn btn-secondary flex-1">
                            <ArrowRight size={16} />
                            Mover a {nextLabel}
                        </button>
                    )}
                    {canPay && (
                        <button
                            onClick={() => {
                                setSelectedPayment('');
                                setShowPayModal(true);
                            }}
                            className="btn btn-primary flex-1"
                        >
                            <CreditCard size={16} />
                            Cobrar
                        </button>
                    )}
                </div>
            </Modal>

            {/* Pay sub-modal */}
            <Modal
                isOpen={showPayModal}
                onClose={() => setShowPayModal(false)}
                title={`Cobrar #${order.orderNumber} — $${Number(order.total).toFixed(2)}`}
            >
                <div className="space-y-2 mb-5">
                    {PAYMENT_METHODS.filter((p) => p.value !== 'MIXED').map((method) => (
                        <button
                            key={method.value}
                            onClick={() => setSelectedPayment(method.value)}
                            className={`w-full flex items-center gap-3 p-3 rounded-revo-sm border-2 text-left transition-all ${
                                selectedPayment === method.value
                                    ? 'border-arcilla-400 bg-arcilla-50'
                                    : 'border-sand hover:border-oliva-200'
                            }`}
                        >
                            <span className="text-xl">{method.icon}</span>
                            <span className="font-ui font-semibold text-sm text-bark">{method.label}</span>
                        </button>
                    ))}
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowPayModal(false)} className="btn btn-outline flex-1">
                        Cancelar
                    </button>
                    <button onClick={handlePay} disabled={!selectedPayment || actionLoading} className="btn btn-primary flex-1">
                        {actionLoading ? 'Procesando...' : 'Confirmar pago'}
                    </button>
                </div>
            </Modal>

            {/* Cancel sub-modal */}
            <Modal isOpen={showCancelModal} onClose={() => setShowCancelModal(false)} title={`Cancelar pedido #${order.orderNumber}`}>
                <div className="space-y-4">
                    <p className="text-sm text-oliva-600 font-body">
                        ¿Seguro que quieres cancelar este pedido? Esta acción no se puede deshacer.
                    </p>
                    <div>
                        <label className="label">Motivo (opcional)</label>
                        <input
                            className="input"
                            placeholder="Ej: Cliente se fue, error de pedido..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-3">
                        <button onClick={() => setShowCancelModal(false)} className="btn btn-outline flex-1">
                            Volver
                        </button>
                        <button
                            onClick={handleCancel}
                            disabled={actionLoading}
                            className="btn btn-primary !bg-arcilla-600 hover:!bg-arcilla-700 flex-1"
                        >
                            {actionLoading ? 'Cancelando...' : 'Sí, cancelar pedido'}
                        </button>
                    </div>
                </div>
            </Modal>
        </>
    );
}

// ─── Main Page ───
export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [zones, setZones] = useState<Zone[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [viewMode, setViewMode] = useState<'active' | 'all'>('active');
    const [statusFilter, setStatusFilter] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);

    const { get, patch } = useApi();
    const { error, success } = useToast();

    // Fetch data
    const fetchOrders = async () => {
        try {
            let res;
            if (viewMode === 'active') {
                res = await get<Order[]>('/orders/active');
            } else {
                const params = new URLSearchParams();
                if (statusFilter) params.set('status', statusFilter);
                params.set('perPage', '50');
                res = await get<any>(`/orders?${params.toString()}`);
            }
            const data = Array.isArray(res) ? res : res?.data || [];
            setOrders(data);
        } catch (err: any) {
            error(err?.message || 'Error al cargar pedidos');
        } finally {
            setLoading(false);
        }
    };

    const fetchMenu = async () => {
        try {
            const res = await get<Category[]>('/menu/categories');
            const data = Array.isArray(res) ? res : (res as any)?.data || [];
            setCategories(data);
        } catch (err) {
            console.error('Error fetching menu:', err);
        }
    };

    const fetchZones = async () => {
        try {
            const res = await get<Zone[]>('/tables/zones');
            const data = Array.isArray(res) ? res : (res as any)?.data || [];
            setZones(data);
        } catch (err) {
            console.error('Error fetching zones:', err);
        }
    };

    useEffect(() => {
        Promise.all([fetchOrders(), fetchMenu(), fetchZones()]);
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [viewMode, statusFilter]);

    // Auto-refresh active orders every 15s
    useEffect(() => {
        if (viewMode !== 'active') return;
        const interval = setInterval(fetchOrders, 15000);
        return () => clearInterval(interval);
    }, [viewMode]);

    const handleAdvanceOrder = async (order: Order) => {
        const nextStatus = NEXT_ORDER_STATUS[order.status];
        if (!nextStatus) return;
        try {
            await patch(`/orders/${order.id}/status`, { status: nextStatus });
            success(`Pedido #${order.orderNumber} → ${ORDER_STATUS_CONFIG[nextStatus].label}`);
            fetchOrders();
        } catch (err: any) {
            error(err?.message || 'Error actualizando estado');
        }
    };

    const openDetail = async (order: Order) => {
        try {
            const res = await get<Order>(`/orders/${order.id}`);
            const data = (res as any)?.data ?? res;
            setSelectedOrder(data);
            setShowDetailModal(true);
        } catch (err) {
            error('Error al cargar detalles del pedido');
        }
    };

    const refreshDetail = async () => {
        if (!selectedOrder) return;
        try {
            const res = await get<Order>(`/orders/${selectedOrder.id}`);
            const data = (res as any)?.data ?? res;
            setSelectedOrder(data);
            fetchOrders();
        } catch (err) {
            setShowDetailModal(false);
        }
    };

    // Filter orders by search
    const filteredOrders = searchQuery
        ? orders.filter(
            (o) =>
                o.orderNumber.toString().includes(searchQuery) ||
                o.table?.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
                o.items?.some((i) => i.productName.toLowerCase().includes(searchQuery.toLowerCase()))
        )
        : orders;

    // Group by status for active view
    const groupedOrders = useMemo(() => {
        if (viewMode !== 'active') return null;
        const groups: Record<string, Order[]> = {
            PENDING: [],
            CONFIRMED: [],
            PREPARING: [],
            READY: [],
            SERVED: [],
        };
        for (const order of filteredOrders) {
            if (groups[order.status]) {
                groups[order.status].push(order);
            }
        }
        return groups;
    }, [filteredOrders, viewMode]);

    // Stats
    const stats = useMemo(
        () => ({
            active: orders.filter((o) => !['PAID', 'CANCELLED'].includes(o.status)).length,
            pending: orders.filter((o) => o.status === 'PENDING').length,
            preparing: orders.filter((o) => o.status === 'PREPARING').length,
            ready: orders.filter((o) => o.status === 'READY').length,
        }),
        [orders]
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-3 border-arcilla-200 border-t-arcilla-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-bark">Pedidos</h1>
                    <p className="text-sm text-oliva-500 font-body mt-1">Gestión y seguimiento de pedidos en tiempo real</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                    <Plus size={18} />
                    Nuevo pedido
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <div className="card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-revo-sm bg-arcilla-100 flex items-center justify-center">
                        <ClipboardList size={18} className="text-arcilla-600" />
                    </div>
                    <div>
                        <p className="text-xs font-ui text-oliva-500">Activos</p>
                        <p className="text-xl font-heading font-bold text-bark">{stats.active}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-revo-sm bg-miel-100 flex items-center justify-center">
                        <Clock size={18} className="text-miel-600" />
                    </div>
                    <div>
                        <p className="text-xs font-ui text-oliva-500">Pendientes</p>
                        <p className="text-xl font-heading font-bold text-miel-600">{stats.pending}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-revo-sm bg-arcilla-100 flex items-center justify-center">
                        <ChefHat size={18} className="text-arcilla-600" />
                    </div>
                    <div>
                        <p className="text-xs font-ui text-oliva-500">En cocina</p>
                        <p className="text-xl font-heading font-bold text-arcilla-600">{stats.preparing}</p>
                    </div>
                </div>
                <div className="card flex items-center gap-3">
                    <div className="w-10 h-10 rounded-revo-sm bg-salvia-100 flex items-center justify-center">
                        <CheckCircle2 size={18} className="text-salvia-600" />
                    </div>
                    <div>
                        <p className="text-xs font-ui text-oliva-500">Listos</p>
                        <p className="text-xl font-heading font-bold text-salvia-600">{stats.ready}</p>
                    </div>
                </div>
            </div>

            {/* View toggle + filters */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex gap-2">
                    <button
                        onClick={() => setViewMode('active')}
                        className={`btn text-xs !px-4 !py-2 ${viewMode === 'active' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        Activos
                    </button>
                    <button
                        onClick={() => setViewMode('all')}
                        className={`btn text-xs !px-4 !py-2 ${viewMode === 'all' ? 'btn-primary' : 'btn-outline'}`}
                    >
                        Todos
                    </button>
                    {viewMode === 'all' && (
                        <select
                            className="input !w-auto !py-2 text-xs"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="">Todos los estados</option>
                            {Object.entries(ORDER_STATUS_CONFIG).map(([key, val]) => (
                                <option key={key} value={key}>
                                    {val.label}
                                </option>
                            ))}
                        </select>
                    )}
                </div>
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-oliva-400" />
                    <input
                        type="text"
                        placeholder="Buscar # o mesa..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="input !w-56 pl-9 !py-2 text-sm"
                    />
                </div>
            </div>

            {/* Orders */}
            {filteredOrders.length === 0 ? (
                <div className="card text-center py-12">
                    <ClipboardList size={48} className="mx-auto text-oliva-300 mb-3" />
                    <h3 className="font-heading font-semibold text-bark">{searchQuery ? 'Sin resultados' : 'Sin pedidos'}</h3>
                    <p className="text-sm text-oliva-500 mt-1">
                        {searchQuery ? 'Intenta con otra búsqueda' : 'Crea el primer pedido del día'}
                    </p>
                    {!searchQuery && (
                        <button onClick={() => setShowCreateModal(true)} className="btn btn-primary mt-4">
                            <Plus size={18} />
                            Crear pedido
                        </button>
                    )}
                </div>
            ) : viewMode === 'active' && groupedOrders ? (
                // Kanban-style grouped view
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {Object.entries(groupedOrders).map(([status, statusOrders]) => {
                        if (statusOrders.length === 0) return null;
                        const conf = ORDER_STATUS_CONFIG[status];
                        const StatusIcon = conf.icon;
                        return (
                            <div key={status}>
                                <div className="flex items-center gap-2 mb-3">
                                    <StatusIcon size={16} className={conf.text} />
                                    <h3 className={`font-heading font-semibold text-sm ${conf.text}`}>{conf.label}</h3>
                                    <span className={`badge ${conf.bg} ${conf.text} text-[10px]`}>{statusOrders.length}</span>
                                </div>
                                <div className="space-y-3">
                                    {statusOrders.map((order) => (
                                        <OrderCard
                                            key={order.id}
                                            order={order}
                                            onAdvance={() => handleAdvanceOrder(order)}
                                            onViewDetails={() => openDetail(order)}
                                        />
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                // List view
                <div className="space-y-3">
                    {filteredOrders.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onAdvance={() => handleAdvanceOrder(order)}
                            onViewDetails={() => openDetail(order)}
                        />
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <CreateOrderModal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                categories={categories}
                zones={zones}
                onCreated={fetchOrders}
            />

            {/* Detail Modal */}
            <OrderDetailModal
                isOpen={showDetailModal}
                onClose={() => setShowDetailModal(false)}
                order={selectedOrder}
                onRefresh={refreshDetail}
            />
        </div>
    );
}