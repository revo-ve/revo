// ============================================
// REVO — Inventory Page (with Permissions)
// ============================================
// Location: apps/dashboard/src/features/inventory/InventoryPage.tsx
// ============================================

import { useEffect, useState, useCallback } from 'react';
import { Package, Search, AlertTriangle, History, Plus, Minus, Settings, X } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermissions';

// ─── Types ───
interface InventoryItem {
    id: string; name: string; category: string; categoryId: string;
    price: number; currentStock: number; minStock: number; stockUnit: string;
    isLowStock: boolean; isOutOfStock: boolean; isAvailable: boolean;
}
interface Stats {
    totalTracked: number; outOfStock: number; lowStock: number;
    healthy: number; totalValue: number; todayMovements: number;
}
interface Alert {
    id: string; name: string; category: string; currentStock: number;
    minStock: number; stockUnit: string; isOutOfStock: boolean; deficit: number;
}
interface Movement {
    id: string; productId: string; productName: string; type: string;
    quantity: number; previousQty: number; newQty: number; stockUnit: string;
    reason: string | null; createdAt: string;
}

// ─── Helpers ───
const fmtUsd = (n: number | undefined | null) => `$${(n ?? 0).toFixed(2)}`;

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    PURCHASE: { label: 'Compra', icon: '📦', color: 'text-salvia-600' },
    SALE: { label: 'Venta', icon: '🛒', color: 'text-arcilla-600' },
    ADJUSTMENT: { label: 'Ajuste', icon: '📋', color: 'text-bark' },
    WASTE: { label: 'Merma', icon: '🗑️', color: 'text-red-600' },
    TRANSFER: { label: 'Transferencia', icon: '🔄', color: 'text-miel-600' },
    RETURN: { label: 'Devolución', icon: '↩️', color: 'text-salvia-600' },
};

const TABS = [
    { key: 'stock', label: 'Stock', icon: Package },
    { key: 'alerts', label: 'Alertas', icon: AlertTriangle },
    { key: 'movements', label: 'Movimientos', icon: History },
];

const formatDate = (d: string) => {
    const dt = new Date(d);
    return dt.toLocaleDateString('es-VE', { day: '2-digit', month: 'short' }) + ' ' +
        dt.toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' });
};

// ─── Main Component ───
export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [movements, setMovements] = useState<Movement[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filterLow, setFilterLow] = useState(false);
    const [activeTab, setActiveTab] = useState<'stock' | 'movements' | 'alerts'>('stock');

    // Modals
    const [actionModal, setActionModal] = useState<{ item: InventoryItem; mode: 'add' | 'remove' | 'adjust' } | null>(null);
    const [actionQty, setActionQty] = useState('');
    const [actionType, setActionType] = useState('');
    const [actionReason, setActionReason] = useState('');
    const [actionError, setActionError] = useState('');

    const [settingsModal, setSettingsModal] = useState<InventoryItem | null>(null);
    const [settingsMin, setSettingsMin] = useState('');
    const [settingsUnit, setSettingsUnit] = useState('');

    const { get, post, put } = useApi();
    const { success, error } = useToast();

    // ─── Permissions ───
    const { can } = usePermissions();
    const canAdjust = can('inventory:adjust');
    const canManage = can('inventory:manage');

    const loadData = useCallback(async () => {
        try {
            const qs = `${filterLow ? 'lowStock=true&' : ''}${search ? `search=${encodeURIComponent(search)}` : ''}`;
            const [inv, st, al, mv] = await Promise.all([
                get<InventoryItem[]>(`/inventory?${qs}`),
                get<Stats>('/inventory/stats'),
                get<Alert[]>('/inventory/alerts'),
                get<Movement[]>('/inventory/movements?limit=30'),
            ]);
            setItems(Array.isArray(inv) ? inv : (inv as any)?.data || []);
            setStats((st as any)?.data ?? st);
            setAlerts(Array.isArray(al) ? al : (al as any)?.data || []);
            setMovements(Array.isArray(mv) ? mv : (mv as any)?.data || []);
        } catch (e: any) {
            error(e.message || 'Error cargando inventario');
        } finally {
            setLoading(false);
        }
    }, [filterLow, search, get, error]);

    useEffect(() => { loadData(); }, [loadData]);

    // ─── Stock Actions ───
    const openAction = (item: InventoryItem, mode: 'add' | 'remove' | 'adjust') => {
        setActionModal({ item, mode });
        setActionQty(mode === 'adjust' ? String(item.currentStock) : '');
        setActionType(mode === 'add' ? 'PURCHASE' : mode === 'remove' ? 'WASTE' : '');
        setActionReason('');
        setActionError('');
    };

    const handleAction = async () => {
        if (!actionModal) return;
        const qty = parseFloat(actionQty);
        if (isNaN(qty) || qty < 0) { setActionError('Cantidad inválida'); return; }

        const { item, mode } = actionModal;
        try {
            if (mode === 'add') {
                await post(`/inventory/${item.id}/add`, { quantity: qty, type: actionType, reason: actionReason || undefined });
                success(`+${qty} ${item.stockUnit} de ${item.name}`);
            } else if (mode === 'remove') {
                await post(`/inventory/${item.id}/remove`, { quantity: qty, type: actionType, reason: actionReason || undefined });
                success(`-${qty} ${item.stockUnit} de ${item.name}`);
            } else {
                await post(`/inventory/${item.id}/adjust`, { newQuantity: qty, reason: actionReason || undefined });
                success(`${item.name} ajustado a ${qty} ${item.stockUnit}`);
            }
            setActionModal(null);
            loadData();
        } catch (e: any) {
            setActionError(e.message || 'Error al guardar');
        }
    };

    const handleSettings = async () => {
        if (!settingsModal) return;
        try {
            await put(`/inventory/${settingsModal.id}/settings`, {
                minStock: parseFloat(settingsMin) || 0,
                stockUnit: settingsUnit || 'unidad',
            });
            success('Configuración actualizada');
            setSettingsModal(null);
            loadData();
        } catch (e: any) {
            error(e.message || 'Error al guardar');
        }
    };

    const stockBar = (current: number, min: number) => {
        const max = Math.max(min * 3, current, 1);
        const pct = Math.min((current / max) * 100, 100);
        const color = current <= 0 ? 'bg-red-500' : current <= min ? 'bg-miel-500' : 'bg-salvia-500';
        const textColor = current <= 0 ? 'text-red-500' : current <= min ? 'text-miel-600' : 'text-salvia-600';
        return { pct, color, textColor };
    };

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
                        <Package className="text-arcilla-500" /> Inventario
                    </h1>
                    <p className="text-sm text-oliva-500 mt-0.5">{stats?.totalTracked ?? 0} productos con stock activo</p>
                </div>
            </div>

            {/* ── Stats ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
                <StatCard label="Valor total" value={fmtUsd(stats?.totalValue)} color="bark" />
                <StatCard label="En stock" value={String(stats?.healthy ?? 0)} color="salvia" />
                <StatCard label="Stock bajo" value={String(stats?.lowStock ?? 0)} color="miel" />
                <StatCard label="Agotados" value={String(stats?.outOfStock ?? 0)} color="red" />
                <StatCard label="Mov. hoy" value={String(stats?.todayMovements ?? 0)} color="arcilla" />
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 border-b border-sand mb-5">
                {TABS.map((t) => {
                    const Icon = t.icon;
                    const count = t.key === 'alerts' ? alerts.length : null;
                    return (
                        <button
                            key={t.key}
                            onClick={() => setActiveTab(t.key as any)}
                            className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 -mb-px ${
                                activeTab === t.key
                                    ? 'border-bark text-bark'
                                    : 'border-transparent text-oliva-400 hover:text-oliva-600'
                            }`}
                        >
                            <Icon size={16} />
                            {t.label}
                            {count !== null && count > 0 && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-red-100 text-red-600 font-bold">{count}</span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Stock Tab ── */}
            {activeTab === 'stock' && (
                <>
                    <div className="flex flex-wrap gap-4 items-center mb-5">
                        <div className="relative flex-1 min-w-[200px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-oliva-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar producto..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="input pl-10 w-full"
                            />
                        </div>
                        <label className="flex items-center gap-2 text-sm text-oliva-600 cursor-pointer">
                            <input type="checkbox" checked={filterLow} onChange={(e) => setFilterLow(e.target.checked)} className="rounded border-oliva-300" />
                            Solo stock bajo
                        </label>
                    </div>

                    {items.length === 0 ? (
                        <EmptyState icon="📦" message="No hay productos con stock activo" />
                    ) : (
                        <div className="space-y-3">
                            {items.map((item) => (
                                <InventoryCard
                                    key={item.id}
                                    item={item}
                                    stockBar={stockBar}
                                    onAction={openAction}
                                    onSettings={(i) => { setSettingsModal(i); setSettingsMin(String(i.minStock)); setSettingsUnit(i.stockUnit); }}
                                    canAdjust={canAdjust}
                                    canManage={canManage}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* ── Alerts Tab ── */}
            {activeTab === 'alerts' && (
                <div className="space-y-3">
                    {alerts.length === 0 ? (
                        <EmptyState icon="✅" message="Todo en orden — no hay alertas" />
                    ) : alerts.map((a) => (
                        <div key={a.id} className={`card flex flex-wrap items-center justify-between gap-4 border-l-4 ${a.isOutOfStock ? 'border-l-red-500' : 'border-l-miel-500'}`}>
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{a.isOutOfStock ? '🔴' : '🟡'}</span>
                                <div>
                                    <p className="font-heading font-bold text-bark">{a.name}</p>
                                    <p className="text-sm text-oliva-500">{a.category}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-bark">{a.currentStock} / {a.minStock} {a.stockUnit}</p>
                                <p className="text-sm text-red-600 font-semibold">Faltan {a.deficit} {a.stockUnit}</p>
                                {canAdjust && (
                                    <button
                                        onClick={() => {
                                            const item = items.find((i) => i.id === a.id);
                                            if (item) openAction(item, 'add');
                                        }}
                                        className="mt-2 px-3 py-1 text-xs bg-salvia-500 text-white font-semibold rounded-revo hover:bg-salvia-600 transition-colors"
                                    >
                                        + Reponer
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Movements Tab ── */}
            {activeTab === 'movements' && (
                <div className="space-y-3">
                    {movements.length === 0 ? (
                        <EmptyState icon="📜" message="No hay movimientos registrados" />
                    ) : movements.map((m) => {
                        const cfg = TYPE_CONFIG[m.type] || { label: m.type, icon: '📋', color: 'text-bark' };
                        const isPositive = ['PURCHASE', 'RETURN'].includes(m.type);
                        return (
                            <div key={m.id} className="card flex flex-wrap items-center justify-between gap-4">
                                <div>
                                    <span className={`text-sm font-bold ${cfg.color}`}>{cfg.icon} {cfg.label}</span>
                                    <p className="font-semibold text-bark mt-1">{m.productName}</p>
                                    {m.reason && <p className="text-sm text-oliva-500">{m.reason}</p>}
                                </div>
                                <div className="text-right">
                                    <p className={`font-heading font-bold ${isPositive ? 'text-salvia-600' : 'text-arcilla-600'}`}>
                                        {isPositive ? '+' : '-'}{m.quantity} {m.stockUnit}
                                    </p>
                                    <p className="text-xs text-oliva-400">{m.previousQty} → {m.newQty}</p>
                                    <p className="text-xs text-oliva-300 mt-1">{formatDate(m.createdAt)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── Action Modal ── */}
            {actionModal && (
                <Modal
                    title={actionModal.mode === 'add' ? 'Entrada de stock' : actionModal.mode === 'remove' ? 'Salida de stock' : 'Ajuste de stock'}
                    onClose={() => setActionModal(null)}
                >
                    <div className="mb-4">
                        <p className="font-heading font-bold text-bark">{actionModal.item.name}</p>
                        <p className="text-sm text-oliva-500">Stock actual: <strong>{actionModal.item.currentStock} {actionModal.item.stockUnit}</strong></p>
                    </div>

                    {actionModal.mode !== 'adjust' && (
                        <div className="mb-4">
                            <label className="label">Tipo</label>
                            <select value={actionType} onChange={(e) => setActionType(e.target.value)} className="input">
                                {actionModal.mode === 'add' ? (
                                    <><option value="PURCHASE">Compra</option><option value="RETURN">Devolución</option></>
                                ) : (
                                    <><option value="WASTE">Merma</option><option value="SALE">Venta manual</option><option value="TRANSFER">Transferencia</option></>
                                )}
                            </select>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="label">{actionModal.mode === 'adjust' ? 'Nueva cantidad' : 'Cantidad'}</label>
                        <div className="flex items-center gap-3">
                            <input type="number" value={actionQty} onChange={(e) => setActionQty(e.target.value)} className="input flex-1" min="0" autoFocus />
                            <span className="text-sm text-oliva-500 font-medium">{actionModal.item.stockUnit}</span>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="label">Motivo (opcional)</label>
                        <input value={actionReason} onChange={(e) => setActionReason(e.target.value)} className="input" placeholder="Ej: Compra proveedor, conteo físico..." />
                    </div>

                    {actionError && <div className="p-3 bg-red-50 border border-red-200 rounded-revo text-red-700 text-sm mb-4">{actionError}</div>}

                    <div className="flex justify-end gap-3 pt-4 border-t border-sand">
                        <button onClick={() => setActionModal(null)} className="btn-secondary">Cancelar</button>
                        <button
                            onClick={handleAction}
                            className={`px-4 py-2 text-white font-semibold rounded-revo transition-colors ${
                                actionModal.mode === 'add' ? 'bg-salvia-500 hover:bg-salvia-600' :
                                    actionModal.mode === 'remove' ? 'bg-arcilla-500 hover:bg-arcilla-600' : 'bg-bark hover:bg-bark/90'
                            }`}
                        >
                            {actionModal.mode === 'add' ? 'Registrar entrada' : actionModal.mode === 'remove' ? 'Registrar salida' : 'Aplicar ajuste'}
                        </button>
                    </div>
                </Modal>
            )}

            {/* ── Settings Modal ── */}
            {settingsModal && (
                <Modal title="Configuración de stock" onClose={() => setSettingsModal(null)} size="sm">
                    <p className="font-heading font-bold text-bark mb-4">{settingsModal.name}</p>
                    <div className="space-y-4">
                        <div>
                            <label className="label">Stock mínimo (alerta)</label>
                            <input type="number" value={settingsMin} onChange={(e) => setSettingsMin(e.target.value)} className="input" min="0" />
                        </div>
                        <div>
                            <label className="label">Unidad de medida</label>
                            <input value={settingsUnit} onChange={(e) => setSettingsUnit(e.target.value)} className="input" placeholder="unidad, porción, botella, kg..." />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-sand">
                        <button onClick={() => setSettingsModal(null)} className="btn-secondary">Cancelar</button>
                        <button onClick={handleSettings} className="btn-primary">Guardar</button>
                    </div>
                </Modal>
            )}
        </div>
    );
}

// ─── Stat Card ───
function StatCard({ label, value, color }: { label: string; value: string; color: 'bark' | 'salvia' | 'miel' | 'red' | 'arcilla' }) {
    const colorMap = {
        bark: 'text-bark', salvia: 'text-salvia-600', miel: 'text-miel-600', red: 'text-red-500', arcilla: 'text-arcilla-600',
    };
    return (
        <div className="card text-center">
            <p className={`text-xl font-heading font-bold ${colorMap[color]}`}>{value}</p>
            <p className="text-xs text-oliva-500 mt-1">{label}</p>
        </div>
    );
}

// ─── Inventory Card ───
function InventoryCard({
                           item,
                           stockBar,
                           onAction,
                           onSettings,
                           canAdjust,
                           canManage,
                       }: {
    item: InventoryItem;
    stockBar: (current: number, min: number) => { pct: number; color: string; textColor: string };
    onAction: (item: InventoryItem, mode: 'add' | 'remove' | 'adjust') => void;
    onSettings: (item: InventoryItem) => void;
    canAdjust: boolean;
    canManage: boolean;
}) {
    const bar = stockBar(item.currentStock, item.minStock);

    return (
        <div className={`card border-l-4 ${bar.color.replace('bg-', 'border-l-')}`}>
            <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-heading font-bold text-bark">{item.name}</span>
                        {item.isOutOfStock && <span className="badge text-[10px] bg-red-100 text-red-700">AGOTADO</span>}
                        {!item.isOutOfStock && item.isLowStock && <span className="badge text-[10px] bg-miel-100 text-miel-700">BAJO</span>}
                    </div>
                    <p className="text-sm text-oliva-500">{item.category} · {fmtUsd(item.price)}</p>
                </div>
                <div className="text-right">
                    <p className={`text-2xl font-heading font-bold ${bar.textColor}`}>{item.currentStock}</p>
                    <p className="text-xs text-oliva-400">{item.stockUnit}</p>
                    <p className="text-[10px] text-oliva-300">mín: {item.minStock}</p>
                </div>
            </div>

            {/* Stock bar */}
            <div className="h-1.5 bg-sand rounded-full overflow-hidden mb-3">
                <div className={`h-full rounded-full transition-all ${bar.color}`} style={{ width: `${bar.pct}%` }} />
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
                {canAdjust && (
                    <button onClick={() => onAction(item, 'add')} className="px-3 py-1.5 text-xs bg-salvia-500 text-white font-semibold rounded-revo hover:bg-salvia-600 transition-colors flex items-center gap-1">
                        <Plus size={14} /> Entrada
                    </button>
                )}
                {canAdjust && (
                    <button onClick={() => onAction(item, 'remove')} className="px-3 py-1.5 text-xs bg-arcilla-500 text-white font-semibold rounded-revo hover:bg-arcilla-600 transition-colors flex items-center gap-1">
                        <Minus size={14} /> Salida
                    </button>
                )}
                {canAdjust && (
                    <button onClick={() => onAction(item, 'adjust')} className="px-3 py-1.5 text-xs border border-oliva-200 text-oliva-600 font-semibold rounded-revo hover:bg-oliva-50 transition-colors">
                        📋 Ajustar
                    </button>
                )}
                {canManage && (
                    <button onClick={() => onSettings(item)} className="icon-btn">
                        <Settings size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}

// ─── Empty State ───
function EmptyState({ icon, message }: { icon: string; message: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-[40vh]">
            <span className="text-5xl mb-3">{icon}</span>
            <p className="text-oliva-400">{message}</p>
        </div>
    );
}

// ─── Modal ───
function Modal({ title, onClose, children, size = 'md' }: { title: string; onClose: () => void; children: React.ReactNode; size?: 'sm' | 'md' }) {
    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className={`bg-white rounded-revo-lg shadow-xl w-full ${size === 'sm' ? 'max-w-sm' : 'max-w-md'}`} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between px-5 py-4 border-b border-sand">
                    <h2 className="font-heading font-bold text-bark">{title}</h2>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-revo bg-sand text-oliva-500 hover:bg-oliva-100 transition-colors">
                        <X size={18} />
                    </button>
                </div>
                <div className="p-5">{children}</div>
            </div>
        </div>
    );
}