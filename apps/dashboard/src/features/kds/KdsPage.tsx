// ============================================
// REVO — KDS (Kitchen Display System) Page
// ============================================
// Location: apps/dashboard/src/features/kds/KdsPage.tsx
// ============================================

import { useEffect, useState, useRef, useCallback } from 'react';
import { Clock, ChefHat, CheckCircle, Utensils, Flame } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';

const REFRESH_MS = 8000;

// ─── Types ───
interface KdsItem {
    id: string;
    name: string;
    quantity: number;
    notes: string | null;
    status: string;
    createdAt: string;
}

interface KdsOrder {
    id: string;
    orderNumber: number;
    type: string;
    status: string;
    table: string | null;
    waiter: string | null;
    notes: string | null;
    createdAt: string;
    items: KdsItem[];
}

interface KdsStats {
    pending: number;
    preparing: number;
    ready: number;
    served: number;
    total: number;
}

// ─── Helpers ───
const elapsed = (dateStr: string) => {
    const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
    if (diff < 1) return 'Ahora';
    if (diff < 60) return `${diff} min`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m`;
};

const elapsedMinutes = (dateStr: string) =>
    Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);

const typeLabels: Record<string, string> = {
    DINE_IN: 'Mesa',
    TAKEOUT: 'Para llevar',
    DELIVERY: 'Delivery',
};
const typeIcons: Record<string, string> = {
    DINE_IN: '🍽️',
    TAKEOUT: '🥡',
    DELIVERY: '🛵',
};

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
    PENDING: { label: 'Pendiente', bg: 'bg-miel-50', text: 'text-miel-700', border: 'border-l-miel-400' },
    PREPARING: { label: 'En preparación', bg: 'bg-arcilla-50', text: 'text-arcilla-700', border: 'border-l-arcilla-400' },
    READY: { label: '¡Listo!', bg: 'bg-salvia-50', text: 'text-salvia-700', border: 'border-l-salvia-500' },
    SERVED: { label: 'Servido', bg: 'bg-oliva-50', text: 'text-oliva-500', border: 'border-l-oliva-300' },
    CONFIRMED: { label: 'Confirmado', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-l-blue-400' },
};

const ORDER_BORDER_CONFIG: Record<string, string> = {
    PENDING: 'border-t-miel-400',
    PREPARING: 'border-t-arcilla-400',
    READY: 'border-t-salvia-500',
    SERVED: 'border-t-oliva-300',
    CONFIRMED: 'border-t-blue-400',
};

const itemNextAction: Record<string, string> = {
    PENDING: 'Preparar',
    PREPARING: 'Listo',
    READY: 'Servido',
};

const FILTERS = [
    { key: 'ALL', label: 'Todos' },
    { key: 'PENDING', label: 'Pendientes' },
    { key: 'CONFIRMED', label: 'Confirmados' },
    { key: 'PREPARING', label: 'En preparación' },
    { key: 'READY', label: 'Listos' },
];

// ─── Main Component ───
export default function KdsPage() {
    const [orders, setOrders] = useState<KdsOrder[]>([]);
    const [stats, setStats] = useState<KdsStats>({ pending: 0, preparing: 0, ready: 0, served: 0, total: 0 });
    const [filter, setFilter] = useState<string>('ALL');
    const [loading, setLoading] = useState(true);
    const prevCountRef = useRef(0);
    const [, setNow] = useState(Date.now());

    const { get, post } = useApi();
    const { success, error } = useToast();

    // Tick every 30s to update elapsed timers
    useEffect(() => {
        const t = setInterval(() => setNow(Date.now()), 30000);
        return () => clearInterval(t);
    }, []);

    const loadData = useCallback(async () => {
        try {
            const [ordersRes, statsRes] = await Promise.all([
                get<KdsOrder[]>('/kds/orders'),
                get<KdsStats>('/kds/stats'),
            ]);

            const ordersData = Array.isArray(ordersRes) ? ordersRes : (ordersRes as any)?.data || [];
            const statsData = (statsRes as any)?.data ?? statsRes;

            // Sound alert on new orders
            if (prevCountRef.current > 0 && ordersData.length > prevCountRef.current) {
                try {
                    new Audio('/notification.mp3').play();
                } catch {}
                success('🔔 ¡Nuevo pedido en cocina!');
            }
            prevCountRef.current = ordersData.length;
            setOrders(ordersData);
            setStats(statsData);
        } catch (e: any) {
            console.error('KDS fetch error:', e);
        } finally {
            setLoading(false);
        }
    }, [get, success]);

    useEffect(() => {
        loadData();
        const t = setInterval(loadData, REFRESH_MS);
        return () => clearInterval(t);
    }, [loadData]);

    const advanceItem = async (itemId: string) => {
        try {
            const res = await post<{ productName: string; status: string }>(`/kds/item/${itemId}/advance`, {});
            const data = (res as any)?.data ?? res;
            success(`${data.productName} → ${STATUS_CONFIG[data.status]?.label || data.status}`);
            loadData();
        } catch {
            error('Error al actualizar');
        }
    };

    const advanceAll = async (orderId: string) => {
        try {
            const res = await post<{ advancedFrom: string; advancedTo: string }>(`/kds/order/${orderId}/advance-all`, {});
            const data = (res as any)?.data ?? res;
            success(`Pedido avanzado: ${data.advancedFrom} → ${data.advancedTo}`);
            loadData();
        } catch {
            error('Error al actualizar');
        }
    };

    const recallItem = async (itemId: string) => {
        try {
            const res = await post<{ productName: string; status: string }>(`/kds/item/${itemId}/recall`, {});
            const data = (res as any)?.data ?? res;
            success(`↩️ ${data.productName} → ${STATUS_CONFIG[data.status]?.label || data.status}`);
            loadData();
        } catch {
            error('Error al retroceder');
        }
    };

    // Filter orders
    const filtered = filter === 'ALL' ? orders : orders.filter((o) => o.status === filter);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-3 border-arcilla-200 border-t-arcilla-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-cream/30">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-bark flex items-center gap-2">
                        <Flame className="text-arcilla-500" /> Cocina
                    </h1>
                    <p className="text-sm text-oliva-500 mt-0.5">KDS — Kitchen Display System</p>
                </div>
                <div className="flex gap-3 flex-wrap">
                    <StatBadge icon={<Clock size={16} />} label="Pendientes" value={stats.pending} color="miel" />
                    <StatBadge icon={<ChefHat size={16} />} label="Preparando" value={stats.preparing} color="arcilla" />
                    <StatBadge icon={<CheckCircle size={16} />} label="Listos" value={stats.ready} color="salvia" />
                    <StatBadge icon={<Utensils size={16} />} label="Servidos" value={stats.served} color="oliva" />
                </div>
            </div>

            {/* ── Filters ── */}
            <div className="flex flex-wrap gap-2 mb-5">
                {FILTERS.map((f) => {
                    const count = f.key === 'ALL' ? null : orders.filter((o) => o.status === f.key).length;
                    return (
                        <button
                            key={f.key}
                            onClick={() => setFilter(f.key)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                filter === f.key
                                    ? 'bg-bark text-white'
                                    : 'bg-sand text-oliva-600 hover:bg-oliva-100'
                            }`}
                        >
                            {f.label}
                            {count !== null && count > 0 && (
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                                        filter === f.key ? 'bg-white/20' : 'bg-oliva-200/50'
                                    }`}
                                >
                  {count}
                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Orders Grid ── */}
            {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-[50vh]">
                    <span className="text-5xl mb-3">👨‍🍳</span>
                    <p className="text-oliva-400">No hay pedidos activos</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {filtered.map((order) => (
                        <OrderCard
                            key={order.id}
                            order={order}
                            onAdvanceItem={advanceItem}
                            onAdvanceAll={advanceAll}
                            onRecallItem={recallItem}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Stat Badge ───
function StatBadge({
                       icon,
                       label,
                       value,
                       color,
                   }: {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: 'miel' | 'arcilla' | 'salvia' | 'oliva';
}) {
    const colorMap = {
        miel: 'text-miel-600 bg-miel-50 border-miel-200',
        arcilla: 'text-arcilla-600 bg-arcilla-50 border-arcilla-200',
        salvia: 'text-salvia-600 bg-salvia-50 border-salvia-200',
        oliva: 'text-oliva-500 bg-oliva-50 border-oliva-200',
    };

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-revo border ${colorMap[color]}`}>
            {icon}
            <div className="flex flex-col">
                <span className="text-lg font-heading font-bold">{value}</span>
                <span className="text-[10px] font-ui text-oliva-500 -mt-1">{label}</span>
            </div>
        </div>
    );
}

// ─── Order Card ───
function OrderCard({
                       order,
                       onAdvanceItem,
                       onAdvanceAll,
                       onRecallItem,
                   }: {
    order: KdsOrder;
    onAdvanceItem: (id: string) => void;
    onAdvanceAll: (id: string) => void;
    onRecallItem: (id: string) => void;
}) {
    const mins = elapsedMinutes(order.createdAt);
    const isUrgent = mins >= 20;
    const isWarning = mins >= 10 && mins < 20;
    const statusConf = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;

    const pendingItems = (order.items || []).filter((i) => i.status === 'PENDING' || i.status === 'PREPARING');
    const canAdvanceAll = pendingItems.length > 0;

    const borderColor = isUrgent
        ? 'border-t-red-500'
        : isWarning
            ? 'border-t-miel-500'
            : ORDER_BORDER_CONFIG[order.status] || 'border-t-miel-400';

    return (
        <div
            className={`bg-white rounded-revo-lg shadow-revo overflow-hidden flex flex-col border-t-4 ${borderColor} ${
                isUrgent ? 'animate-pulse' : ''
            }`}
        >
            {/* Card header */}
            <div className={`flex items-center justify-between px-4 py-3 ${statusConf.bg}`}>
                <div className="flex items-center gap-3">
                    <span className="font-heading font-bold text-lg text-bark">#{order.orderNumber}</span>
                    <span className="text-sm font-semibold text-oliva-600">
            {typeIcons[order.type] || '🍽️'}{' '}
                        {order.type === 'DINE_IN' && order.table ? order.table : typeLabels[order.type] || order.type}
          </span>
                </div>
                <span
                    className={`text-sm font-semibold ${
                        isUrgent ? 'text-red-500 font-bold' : isWarning ? 'text-miel-600' : 'text-oliva-400'
                    }`}
                >
          ⏱ {elapsed(order.createdAt)}
        </span>
            </div>

            {/* Waiter & notes */}
            {(order.waiter || order.notes) && (
                <div className="flex flex-wrap gap-2 px-4 py-2">
                    {order.waiter && (
                        <span className="text-xs bg-sand text-oliva-600 px-2 py-1 rounded font-medium">
              👤 {order.waiter}
            </span>
                    )}
                    {order.notes && (
                        <span className="text-xs bg-miel-50 text-miel-700 px-2 py-1 rounded font-medium">
              📝 {order.notes}
            </span>
                    )}
                </div>
            )}

            {/* Items */}
            <div className="flex-1 px-4 py-2 space-y-2">
                {(order.items || []).map((item) => {
                    const itemConf = STATUS_CONFIG[item.status] || STATUS_CONFIG.PENDING;
                    const canAdvance = item.status !== 'SERVED';
                    const canRecall = item.status !== 'PENDING';

                    return (
                        <div
                            key={item.id}
                            className={`bg-cream/50 rounded-revo p-3 border-l-4 ${itemConf.border}`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <span className="font-heading font-bold text-bark">{item.quantity}×</span>
                                    <span className="font-ui font-semibold text-sm text-bark">{item.name}</span>
                                </div>
                                <span className={`badge text-xs ${itemConf.bg} ${itemConf.text}`}>
                  {itemConf.label}
                </span>
                            </div>

                            {item.notes && (
                                <p className="text-xs text-miel-700 mt-1 pl-1">💬 {item.notes}</p>
                            )}

                            <div className="flex justify-end gap-2 mt-2">
                                {canRecall && (
                                    <button
                                        onClick={() => onRecallItem(item.id)}
                                        className="px-2 py-1 text-xs border border-oliva-200 rounded-revo-sm hover:bg-oliva-50 transition-colors"
                                    >
                                        ↩️
                                    </button>
                                )}
                                {canAdvance && (
                                    <button
                                        onClick={() => onAdvanceItem(item.id)}
                                        className="px-3 py-1 text-xs bg-salvia-500 text-white font-semibold rounded-revo-sm hover:bg-salvia-600 transition-colors"
                                    >
                                        {itemNextAction[item.status] || 'Avanzar'} →
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Card footer */}
            {canAdvanceAll && (
                <div className="px-4 py-3 border-t border-sand">
                    <button
                        onClick={() => onAdvanceAll(order.id)}
                        className="w-full py-2 bg-bark text-white font-semibold rounded-revo hover:bg-bark/90 transition-colors"
                    >
                        ⏩ Avanzar todo
                    </button>
                </div>
            )}
        </div>
    );
}