// ============================================
// REVO — POS Page (Refactored)
// ============================================
// Location: apps/dashboard/src/features/pos/PosPage.tsx
// ============================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Minus, Plus, ShoppingCart, Send, CreditCard, ClipboardList, Trash2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';

// ─── Types ───
interface Category {
    id: string;
    name: string;
    products: Product[];
}

interface Product {
    id: string;
    name: string;
    price: number;
    description: string | null;
    available: boolean;
}

interface Table {
    id: string;
    number: string;
    zone: string;
    status: string;
    capacity: number;
}

interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    notes: string;
}

interface OpenOrder {
    id: string;
    orderNumber: number;
    table: string | null;
    type: string;
    status: string;
    total: number;
    itemsSummary: string;
    items: Array<{ name: string; quantity: number; price: number }>;
    createdAt: string;
}

interface PosStats {
    revenue: number;
    ordersToday: number;
    paidOrders: number;
    activeOrders: number;
    avgTicket: number;
}

// ─── Constants ───
const fmtUsd = (n: number | undefined | null) => `$${(n ?? 0).toFixed(2)}`;

const ORDER_TYPES = [
    { value: 'DINE_IN', label: 'En sala', icon: '🍽️' },
    { value: 'TAKEOUT', label: 'Para llevar', icon: '🥡' },
    { value: 'DELIVERY', label: 'Delivery', icon: '🛵' },
];

const PAYMENT_METHODS = [
    { value: 'PAGO_MOVIL', label: 'Pago Móvil', icon: '📱', color: 'arcilla' },
    { value: 'ZELLE', label: 'Zelle', icon: '💸', color: 'salvia' },
    { value: 'CASH_USD', label: 'Efectivo USD', icon: '💵', color: 'miel' },
    { value: 'CASH_VES', label: 'Efectivo Bs', icon: '💰', color: 'miel' },
    { value: 'TRANSFER', label: 'Transferencia', icon: '🏦', color: 'blue' },
    { value: 'POINT_OF_SALE', label: 'Punto', icon: '💳', color: 'purple' },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    PENDING: { label: 'Pendiente', bg: 'bg-miel-100', text: 'text-miel-700' },
    CONFIRMED: { label: 'Confirmado', bg: 'bg-blue-100', text: 'text-blue-700' },
    PREPARING: { label: 'En cocina', bg: 'bg-arcilla-100', text: 'text-arcilla-700' },
    READY: { label: 'Listo', bg: 'bg-salvia-100', text: 'text-salvia-700' },
    SERVED: { label: 'Servido', bg: 'bg-oliva-100', text: 'text-oliva-700' },
};

// ─── Main Component ───
export default function PosPage() {
    // API data
    const [categories, setCategories] = useState<Category[]>([]);
    const [tables, setTables] = useState<Table[]>([]);
    const [openOrders, setOpenOrders] = useState<OpenOrder[]>([]);
    const [stats, setStats] = useState<PosStats | null>(null);
    const [loading, setLoading] = useState(true);

    // UI state
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [orderType, setOrderType] = useState('DINE_IN');
    const [selectedTable, setSelectedTable] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [orderNotes, setOrderNotes] = useState('');

    // Modals
    const [showPayment, setShowPayment] = useState(false);
    const [showOpenOrders, setShowOpenOrders] = useState(false);
    const [settlingOrder, setSettlingOrder] = useState<OpenOrder | null>(null);
    const [processing, setProcessing] = useState(false);

    const { get, post } = useApi();
    const { success, error } = useToast();

    // ─── Data Loading ───
    const loadData = useCallback(async () => {
        try {
            const [cats, tbls, orders, posStats] = await Promise.all([
                get<Category[]>('/pos/products'),
                get<Table[]>('/pos/tables'),
                get<OpenOrder[]>('/pos/open-orders'),
                get<PosStats>('/pos/stats'),
            ]);
            setCategories(Array.isArray(cats) ? cats : (cats as any)?.data || []);
            setTables(Array.isArray(tbls) ? tbls : (tbls as any)?.data || []);
            setOpenOrders(Array.isArray(orders) ? orders : (orders as any)?.data || []);
            setStats(posStats as PosStats);
        } catch (e: any) {
            error(e.message || 'Error cargando datos del POS');
        } finally {
            setLoading(false);
        }
    }, [get, error]);

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, [loadData]);

    // ─── Derived Data ───
    const filteredProducts = useMemo(() => {
        let products: (Product & { categoryName: string })[] = [];
        categories.forEach((cat) => {
            if (selectedCategory !== 'all' && cat.id !== selectedCategory) return;
            (cat.products || []).forEach((p) => {
                if (p.available !== false) {
                    products.push({ ...p, categoryName: cat.name });
                }
            });
        });
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            products = products.filter((p) => p.name.toLowerCase().includes(q));
        }
        return products;
    }, [categories, selectedCategory, searchQuery]);

    const availableTables = useMemo(
        () => tables.filter((t) => t.status === 'AVAILABLE'),
        [tables]
    );

    const cartTotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

    // ─── Cart Operations ───
    const addToCart = (product: Product) => {
        setCart((prev) => {
            const existing = prev.find((i) => i.productId === product.id);
            if (existing) {
                return prev.map((i) =>
                    i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i
                );
            }
            return [...prev, { productId: product.id, name: product.name, price: product.price, quantity: 1, notes: '' }];
        });
    };

    const removeFromCart = (productId: string) => {
        setCart((prev) => prev.filter((i) => i.productId !== productId));
    };

    const updateQuantity = (productId: string, delta: number) => {
        setCart((prev) =>
            prev
                .map((i) => {
                    if (i.productId !== productId) return i;
                    const newQty = i.quantity + delta;
                    return newQty > 0 ? { ...i, quantity: newQty } : i;
                })
                .filter((i) => i.quantity > 0)
        );
    };

    const updateItemNotes = (productId: string, notes: string) => {
        setCart((prev) => prev.map((i) => (i.productId === productId ? { ...i, notes } : i)));
    };

    const clearCart = () => {
        setCart([]);
        setOrderNotes('');
        setSelectedTable('');
    };

    // ─── Create Order ───
    const createOrder = async (payNow = false, paymentMethod?: string) => {
        if (cart.length === 0) return;
        if (orderType === 'DINE_IN' && !selectedTable) {
            error('Selecciona una mesa para pedidos en sala');
            return;
        }

        setProcessing(true);
        try {
            const result = await post<{ orderNumber: number; total: number }>('/pos/order', {
                type: orderType,
                tableId: orderType === 'DINE_IN' ? selectedTable : undefined,
                items: cart.map((i) => ({
                    productId: i.productId,
                    quantity: i.quantity,
                    notes: i.notes || undefined,
                })),
                notes: orderNotes || undefined,
                payNow,
                paymentMethod,
            });

            const data = (result as any)?.data ?? result;
            success(
                payNow
                    ? `Pedido #${data.orderNumber} cobrado — ${fmtUsd(data.total)}`
                    : `Pedido #${data.orderNumber} enviado a cocina`
            );

            clearCart();
            setShowPayment(false);
            loadData();
        } catch (e: any) {
            error(e.message || 'Error creando pedido');
        } finally {
            setProcessing(false);
        }
    };

    // ─── Settle Existing Order ───
    const settleExistingOrder = async (paymentMethod: string) => {
        if (!settlingOrder) return;
        setProcessing(true);
        try {
            const result = await post<{ orderNumber: number; total: number }>(
                `/pos/settle/${settlingOrder.id}`,
                { paymentMethod }
            );
            const data = (result as any)?.data ?? result;
            success(`Pedido #${data.orderNumber} cobrado — ${fmtUsd(data.total)}`);
            setSettlingOrder(null);
            setShowOpenOrders(false);
            loadData();
        } catch (e: any) {
            error(e.message || 'Error cobrando pedido');
        } finally {
            setProcessing(false);
        }
    };

    // ─── Loading State ───
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-3 border-arcilla-200 border-t-arcilla-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3 h-[calc(100vh-64px)] max-h-[calc(100vh-64px)] overflow-hidden">
            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 pt-4">
                <div>
                    <h1 className="text-xl font-heading font-bold text-bark">Punto de Venta</h1>
                    {stats && (
                        <div className="flex gap-2 mt-1">
                            <span className="badge bg-miel-100 text-miel-700">💰 {fmtUsd(stats.revenue)}</span>
                            <span className="badge bg-oliva-100 text-oliva-600">🧾 {stats.ordersToday} pedidos</span>
                            <span className="badge bg-salvia-100 text-salvia-700">⚡ {stats.activeOrders} activos</span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setShowOpenOrders(true)}
                    className="btn btn-outline relative"
                >
                    <ClipboardList size={18} />
                    Abiertos
                    {openOrders.length > 0 && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-arcilla-500 text-white text-xs font-bold flex items-center justify-center">
              {openOrders.length}
            </span>
                    )}
                </button>
            </div>

            {/* ── Order Type + Table ── */}
            <div className="flex items-center gap-2 px-4">
                {ORDER_TYPES.map((ot) => (
                    <button
                        key={ot.value}
                        onClick={() => {
                            setOrderType(ot.value);
                            if (ot.value !== 'DINE_IN') setSelectedTable('');
                        }}
                        className={`px-4 py-2 rounded-revo text-sm font-ui font-semibold transition-all ${
                            orderType === ot.value
                                ? 'bg-arcilla-500 text-white'
                                : 'bg-sand text-oliva-600 hover:bg-oliva-100'
                        }`}
                    >
                        {ot.icon} {ot.label}
                    </button>
                ))}

                {orderType === 'DINE_IN' && (
                    <select
                        value={selectedTable}
                        onChange={(e) => setSelectedTable(e.target.value)}
                        className="input !w-auto !py-2 text-sm ml-2"
                    >
                        <option value="">Mesa...</option>
                        {availableTables.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.zone} — {t.number}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* ── Main: Products + Cart ── */}
            <div className="flex flex-1 gap-4 px-4 pb-4 overflow-hidden">
                {/* ── Products Panel ── */}
                <div className="flex-1 flex flex-col bg-white rounded-revo-lg border border-sand overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-sand">
                        <input
                            type="text"
                            placeholder="🔍 Buscar producto..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="input !py-2 text-sm"
                        />
                    </div>

                    {/* Category tabs */}
                    <div className="flex gap-2 p-3 border-b border-sand overflow-x-auto hide-scrollbar">
                        <button
                            onClick={() => setSelectedCategory('all')}
                            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-ui font-semibold transition-colors ${
                                selectedCategory === 'all'
                                    ? 'bg-arcilla-500 text-white'
                                    : 'bg-sand text-oliva-600 hover:bg-oliva-100'
                            }`}
                        >
                            Todos
                        </button>
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-ui font-semibold transition-colors ${
                                    selectedCategory === cat.id
                                        ? 'bg-arcilla-500 text-white'
                                        : 'bg-sand text-oliva-600 hover:bg-oliva-100'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>

                    {/* Product grid */}
                    <div className="flex-1 overflow-y-auto p-3">
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                            {filteredProducts.map((product) => {
                                const inCart = cart.find((i) => i.productId === product.id);
                                return (
                                    <button
                                        key={product.id}
                                        onClick={() => addToCart(product)}
                                        className={`relative text-left p-3 rounded-revo border-2 transition-all ${
                                            inCart
                                                ? 'border-arcilla-400 bg-arcilla-50'
                                                : 'border-sand hover:border-arcilla-300 hover:shadow-sm'
                                        }`}
                                    >
                                        {inCart && (
                                            <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-arcilla-500 text-white text-xs font-bold flex items-center justify-center">
                        {inCart.quantity}
                      </span>
                                        )}
                                        <p className="font-ui font-semibold text-sm text-bark line-clamp-2">{product.name}</p>
                                        <p className="font-heading font-bold text-arcilla-500 mt-1">{fmtUsd(product.price)}</p>
                                        {selectedCategory === 'all' && (
                                            <p className="text-[10px] text-oliva-400 mt-0.5">{product.categoryName}</p>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {filteredProducts.length === 0 && (
                            <div className="text-center py-12 text-oliva-400">No hay productos disponibles</div>
                        )}
                    </div>
                </div>

                {/* ── Cart Panel ── */}
                <div className="w-80 flex flex-col bg-white rounded-revo-lg border border-sand overflow-hidden">
                    {/* Cart header */}
                    <div className="flex items-center justify-between p-4 border-b border-sand">
                        <h3 className="font-heading font-bold text-bark flex items-center gap-2">
                            <ShoppingCart size={18} />
                            Pedido
                            {cartCount > 0 && (
                                <span className="badge bg-arcilla-500 text-white text-xs">{cartCount}</span>
                            )}
                        </h3>
                        {cart.length > 0 && (
                            <button onClick={clearCart} className="text-xs text-oliva-500 hover:text-arcilla-500 font-semibold">
                                Limpiar
                            </button>
                        )}
                    </div>

                    {/* Cart items */}
                    <div className="flex-1 overflow-y-auto p-3 space-y-2">
                        {cart.length === 0 ? (
                            <div className="text-center py-12">
                                <p className="text-4xl mb-2">🍽️</p>
                                <p className="text-sm text-oliva-400">Toca un producto para agregarlo</p>
                            </div>
                        ) : (
                            cart.map((item) => (
                                <div key={item.productId} className="bg-cream/50 rounded-revo p-3">
                                    <div className="flex items-start justify-between mb-2">
                                        <span className="font-ui font-semibold text-sm text-bark flex-1">{item.name}</span>
                                        <button
                                            onClick={() => removeFromCart(item.productId)}
                                            className="text-oliva-400 hover:text-arcilla-500 p-1"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <button
                                                onClick={() => updateQuantity(item.productId, -1)}
                                                className="w-7 h-7 rounded-full bg-sand flex items-center justify-center hover:bg-oliva-100 transition-colors"
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className="w-7 text-center font-ui font-bold text-sm">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.productId, 1)}
                                                className="w-7 h-7 rounded-full bg-sand flex items-center justify-center hover:bg-oliva-100 transition-colors"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                        <span className="font-heading font-bold text-arcilla-500">
                      {fmtUsd(item.price * item.quantity)}
                    </span>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Nota..."
                                        value={item.notes}
                                        onChange={(e) => updateItemNotes(item.productId, e.target.value)}
                                        className="w-full mt-2 text-xs border-0 border-b border-dashed border-oliva-200 bg-transparent py-1 outline-none text-oliva-500 placeholder:text-oliva-300"
                                    />
                                </div>
                            ))
                        )}
                    </div>

                    {/* Notes + Footer */}
                    {cart.length > 0 && (
                        <>
                            <input
                                type="text"
                                placeholder="Notas del pedido..."
                                value={orderNotes}
                                onChange={(e) => setOrderNotes(e.target.value)}
                                className="border-t border-sand px-4 py-3 text-sm outline-none bg-cream/30"
                            />
                            <div className="p-4 border-t-2 border-sand space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-semibold text-oliva-500">Total</span>
                                    <span className="font-heading text-2xl font-black text-bark">{fmtUsd(cartTotal)}</span>
                                </div>
                                <button
                                    onClick={() => createOrder(false)}
                                    disabled={processing}
                                    className="w-full btn btn-outline !border-miel-400 !text-miel-600 hover:!bg-miel-50"
                                >
                                    <Send size={16} />
                                    Enviar a cocina
                                </button>
                                <button
                                    onClick={() => setShowPayment(true)}
                                    disabled={processing}
                                    className="w-full btn btn-primary"
                                >
                                    <CreditCard size={16} />
                                    Cobrar {fmtUsd(cartTotal)}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* ── Payment Modal (new order) ── */}
            {showPayment && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-bark/40 backdrop-blur-sm"
                    onClick={() => !processing && setShowPayment(false)}
                >
                    <div
                        className="bg-white rounded-revo-lg p-8 w-full max-w-md mx-4 animate-modal-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="font-heading font-bold text-lg text-bark text-center">Cobrar pedido</h2>
                        <p className="font-heading text-4xl font-black text-arcilla-500 text-center my-2">
                            {fmtUsd(cartTotal)}
                        </p>
                        <p className="text-xs text-oliva-400 text-center mb-5">Selecciona el método de pago</p>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {PAYMENT_METHODS.map((pm) => (
                                <button
                                    key={pm.value}
                                    onClick={() => createOrder(true, pm.value)}
                                    disabled={processing}
                                    className="flex flex-col items-center gap-2 p-4 rounded-revo border-2 border-oliva-200 hover:border-arcilla-400 hover:bg-arcilla-50 transition-all"
                                >
                                    <span className="text-2xl">{pm.icon}</span>
                                    <span className="font-ui font-semibold text-sm text-bark">{pm.label}</span>
                                </button>
                            ))}
                        </div>

                        <button onClick={() => setShowPayment(false)} className="w-full btn btn-outline">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* ── Payment Modal (settle existing) ── */}
            {settlingOrder && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-bark/40 backdrop-blur-sm"
                    onClick={() => !processing && setSettlingOrder(null)}
                >
                    <div
                        className="bg-white rounded-revo-lg p-8 w-full max-w-md mx-4 animate-modal-in"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 className="font-heading font-bold text-lg text-bark text-center">
                            Cobrar pedido #{settlingOrder.orderNumber}
                        </h2>
                        <p className="text-xs text-oliva-400 text-center mb-1">
                            {settlingOrder.table ? `Mesa ${settlingOrder.table}` : 'Sin mesa'} · {settlingOrder.itemsSummary}
                        </p>
                        <p className="font-heading text-4xl font-black text-arcilla-500 text-center my-2">
                            {fmtUsd(settlingOrder.total)}
                        </p>

                        <div className="grid grid-cols-2 gap-3 mb-4">
                            {PAYMENT_METHODS.map((pm) => (
                                <button
                                    key={pm.value}
                                    onClick={() => settleExistingOrder(pm.value)}
                                    disabled={processing}
                                    className="flex flex-col items-center gap-2 p-4 rounded-revo border-2 border-oliva-200 hover:border-arcilla-400 hover:bg-arcilla-50 transition-all"
                                >
                                    <span className="text-2xl">{pm.icon}</span>
                                    <span className="font-ui font-semibold text-sm text-bark">{pm.label}</span>
                                </button>
                            ))}
                        </div>

                        <button onClick={() => setSettlingOrder(null)} className="w-full btn btn-outline">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* ── Open Orders Side Panel ── */}
            {showOpenOrders && (
                <div
                    className="fixed inset-0 z-50 bg-bark/40 backdrop-blur-sm"
                    onClick={() => setShowOpenOrders(false)}
                >
                    <div
                        className="absolute top-0 right-0 w-96 max-w-[90vw] h-full bg-white shadow-xl flex flex-col animate-slide-in-right"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-sand">
                            <h2 className="font-heading font-bold text-bark">📋 Pedidos abiertos</h2>
                            <button
                                onClick={() => setShowOpenOrders(false)}
                                className="w-8 h-8 rounded-lg border border-sand flex items-center justify-center hover:bg-sand transition-colors"
                            >
                                <X size={16} className="text-oliva-500" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {openOrders.length === 0 ? (
                                <div className="text-center py-12 text-oliva-400">No hay pedidos abiertos</div>
                            ) : (
                                openOrders.map((order) => {
                                    const statusConf = STATUS_CONFIG[order.status] || { label: order.status, bg: 'bg-oliva-100', text: 'text-oliva-600' };
                                    return (
                                        <div key={order.id} className="p-4 border border-sand rounded-revo space-y-2">
                                            <div className="flex items-center justify-between">
                                                <span className="font-heading font-bold text-bark">#{order.orderNumber}</span>
                                                <span className={`badge ${statusConf.bg} ${statusConf.text} text-xs`}>
                          {statusConf.label}
                        </span>
                                            </div>
                                            <div className="text-xs text-oliva-500 truncate">
                                                {order.table && <span>Mesa {order.table} · </span>}
                                                {order.itemsSummary}
                                            </div>
                                            <div className="flex items-center justify-between pt-2">
                                                <span className="font-heading font-bold text-bark">{fmtUsd(order.total)}</span>
                                                <button
                                                    onClick={() => setSettlingOrder(order)}
                                                    className="btn btn-primary text-xs !px-4 !py-2"
                                                >
                                                    💰 Cobrar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}