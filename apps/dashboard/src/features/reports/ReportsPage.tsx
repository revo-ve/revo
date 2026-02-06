// ============================================
// REVO — Reports Page (Refactored)
// ============================================
// Location: apps/dashboard/src/features/reports/ReportsPage.tsx
// ============================================

import { useEffect, useState, useCallback } from 'react';
import { BarChart3, TrendingUp, TrendingDown, DollarSign, ShoppingBag, Receipt, Users } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';

// ─── Types ───
interface Summary {
    totalSales: number;
    totalSubtotal: number;
    totalTax: number;
    totalDiscount: number;
    orderCount: number;
    avgTicket: number;
    byType: Array<{ type: string; count: number; total: number }>;
    byPayment: Array<{ method: string; count: number; total: number }>;
}

interface DayData { date: string; total: number; count: number }
interface HourData { hour: number; label: string; total: number; count: number }
interface ProductData { name: string; quantity: number; revenue: number }
interface CategoryData { name: string; quantity: number; revenue: number }
interface WaiterData { name: string; count: number; total: number; avgTicket: number }
interface Comparison { current: Summary; previous: Summary; changes: { sales: number; orders: number; avgTicket: number } }

// ─── Helpers ───
const fmtUsd = (n: number | undefined | null) => `$${(n ?? 0).toFixed(2)}`;
const fmtPct = (n: number) => `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;

const typeLabels: Record<string, string> = { DINE_IN: 'En sala', TAKEOUT: 'Para llevar', DELIVERY: 'Delivery' };
const typeIcons: Record<string, string> = { DINE_IN: '🍽️', TAKEOUT: '🥡', DELIVERY: '🛵' };
const paymentLabels: Record<string, string> = {
    CASH_VES: 'Efectivo Bs', CASH_USD: 'Efectivo USD', PAGO_MOVIL: 'Pago Móvil',
    ZELLE: 'Zelle', TRANSFER: 'Transferencia', POINT_OF_SALE: 'Punto de venta', MIXED: 'Mixto',
};

const COLORS = ['bg-salvia-500', 'bg-arcilla-500', 'bg-miel-500', 'bg-bark', 'bg-oliva-500', 'bg-blue-500', 'bg-purple-500'];

const PRESETS = [
    { key: 'today', label: 'Hoy' },
    { key: 'yesterday', label: 'Ayer' },
    { key: 'week', label: '7 días' },
    { key: 'month', label: '30 días' },
    { key: 'thisMonth', label: 'Este mes' },
];

const TABS = [
    { key: 'overview', label: 'Resumen', icon: BarChart3 },
    { key: 'products', label: 'Productos', icon: ShoppingBag },
    { key: 'team', label: 'Equipo', icon: Users },
];

// ─── Date Presets ───
const getPreset = (key: string): { from: string; to: string; label: string } => {
    const now = new Date();
    const today = new Date(now); today.setHours(0, 0, 0, 0);
    const endOfToday = new Date(now); endOfToday.setHours(23, 59, 59, 999);

    switch (key) {
        case 'today': return { from: today.toISOString(), to: endOfToday.toISOString(), label: 'Hoy' };
        case 'yesterday': {
            const y = new Date(today); y.setDate(y.getDate() - 1);
            const ye = new Date(y); ye.setHours(23, 59, 59, 999);
            return { from: y.toISOString(), to: ye.toISOString(), label: 'Ayer' };
        }
        case 'week': {
            const w = new Date(today); w.setDate(w.getDate() - 6);
            return { from: w.toISOString(), to: endOfToday.toISOString(), label: 'Últimos 7 días' };
        }
        case 'month': {
            const m = new Date(today); m.setDate(m.getDate() - 29);
            return { from: m.toISOString(), to: endOfToday.toISOString(), label: 'Últimos 30 días' };
        }
        case 'thisMonth': {
            const fm = new Date(today.getFullYear(), today.getMonth(), 1);
            return { from: fm.toISOString(), to: endOfToday.toISOString(), label: 'Este mes' };
        }
        default: return { from: today.toISOString(), to: endOfToday.toISOString(), label: 'Hoy' };
    }
};

// ─── Main Component ───
export default function ReportsPage() {
    const [preset, setPreset] = useState('week');
    const [dateRange, setDateRange] = useState(getPreset('week'));
    const [comparison, setComparison] = useState<Comparison | null>(null);
    const [byDay, setByDay] = useState<DayData[]>([]);
    const [byHour, setByHour] = useState<HourData[]>([]);
    const [topProducts, setTopProducts] = useState<ProductData[]>([]);
    const [byCategory, setByCategory] = useState<CategoryData[]>([]);
    const [byWaiter, setByWaiter] = useState<WaiterData[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'team'>('overview');

    const { get } = useApi();
    const { error } = useToast();

    const loadData = useCallback(async () => {
        setLoading(true);
        const qs = `from=${encodeURIComponent(dateRange.from)}&to=${encodeURIComponent(dateRange.to)}`;
        try {
            const [comp, days, hours, prods, cats, waiters] = await Promise.all([
                get<Comparison>(`/reports/comparison?${qs}`),
                get<DayData[]>(`/reports/by-day?${qs}`),
                get<HourData[]>(`/reports/by-hour?date=${encodeURIComponent(dateRange.to)}`),
                get<ProductData[]>(`/reports/top-products?${qs}&limit=10`),
                get<CategoryData[]>(`/reports/by-category?${qs}`),
                get<WaiterData[]>(`/reports/by-waiter?${qs}`),
            ]);

            setComparison((comp as any)?.data ?? comp);
            setByDay(Array.isArray(days) ? days : (days as any)?.data || []);
            setByHour(Array.isArray(hours) ? hours : (hours as any)?.data || []);
            setTopProducts(Array.isArray(prods) ? prods : (prods as any)?.data || []);
            setByCategory(Array.isArray(cats) ? cats : (cats as any)?.data || []);
            setByWaiter(Array.isArray(waiters) ? waiters : (waiters as any)?.data || []);
        } catch (e: any) {
            error(e.message || 'Error cargando reportes');
        } finally {
            setLoading(false);
        }
    }, [dateRange, get, error]);

    useEffect(() => { loadData(); }, [loadData]);

    const handlePreset = (key: string) => {
        setPreset(key);
        setDateRange(getPreset(key));
    };

    const summary = comparison?.current;
    const changes = comparison?.changes;

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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-bark flex items-center gap-2">
                        <BarChart3 className="text-arcilla-500" /> Reportes
                    </h1>
                    <p className="text-sm text-oliva-500 mt-0.5">{dateRange.label}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    {PRESETS.map((p) => (
                        <button
                            key={p.key}
                            onClick={() => handlePreset(p.key)}
                            className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                                preset === p.key
                                    ? 'bg-bark text-white'
                                    : 'bg-sand text-oliva-600 hover:bg-oliva-100'
                            }`}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <SummaryCard label="Ventas totales" value={fmtUsd(summary?.totalSales)} change={changes?.sales} icon={<DollarSign />} big />
                <SummaryCard label="Pedidos" value={String(summary?.orderCount ?? 0)} change={changes?.orders} icon={<ShoppingBag />} />
                <SummaryCard label="Ticket promedio" value={fmtUsd(summary?.avgTicket)} change={changes?.avgTicket} icon={<Receipt />} />
                <SummaryCard label="Impuestos" value={fmtUsd(summary?.totalTax)} icon={<BarChart3 />} />
            </div>

            {/* ── Tabs ── */}
            <div className="flex gap-1 border-b border-sand mb-6">
                {TABS.map((t) => {
                    const Icon = t.icon;
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
                        </button>
                    );
                })}
            </div>

            {/* ── Tab Content ── */}
            {activeTab === 'overview' && (
                <div className="space-y-5">
                    {/* Sales by Day */}
                    <ChartCard title="Ventas por día">
                        <BarChart data={byDay.map((d) => ({ label: d.date.slice(5), value: d.total }))} color="salvia" />
                    </ChartCard>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {/* Sales by Hour */}
                        <ChartCard title="Ventas por hora (último día del rango)">
                            <BarChart
                                data={byHour.filter((h) => h.total > 0 || (h.hour >= 8 && h.hour <= 22)).map((h) => ({ label: h.label, value: h.total }))}
                                color="arcilla"
                            />
                        </ChartCard>

                        {/* Payment Methods */}
                        <ChartCard title="Métodos de pago">
                            {(summary?.byPayment ?? []).length === 0 ? (
                                <EmptyState />
                            ) : (
                                <div className="space-y-3">
                                    {(summary?.byPayment ?? []).map((pm, i) => (
                                        <div key={pm.method} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${COLORS[i % COLORS.length]}`} />
                                                <span className="text-sm font-semibold text-bark">{paymentLabels[pm.method] || pm.method}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-heading font-bold text-bark">{fmtUsd(pm.total)}</p>
                                                <p className="text-xs text-oliva-400">{pm.count} pedidos</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ChartCard>
                    </div>

                    {/* By Type */}
                    <ChartCard title="Ventas por tipo de servicio">
                        {(summary?.byType ?? []).length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {(summary?.byType ?? []).map((t, i) => (
                                    <div key={t.type} className="flex items-center gap-4 bg-cream/50 rounded-revo p-4">
                                        <div className={`w-12 h-12 rounded-revo flex items-center justify-center text-2xl ${COLORS[i % COLORS.length]} bg-opacity-20`}>
                                            {typeIcons[t.type] || '🍽️'}
                                        </div>
                                        <div>
                                            <p className="text-xs text-oliva-500">{typeLabels[t.type] || t.type}</p>
                                            <p className="font-heading font-bold text-lg text-bark">{fmtUsd(t.total)}</p>
                                            <p className="text-xs text-oliva-400">{t.count} pedidos</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </ChartCard>
                </div>
            )}

            {activeTab === 'products' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Top Products */}
                    <div className="lg:col-span-2">
                        <ChartCard title="Top 10 productos">
                            {topProducts.length === 0 ? (
                                <EmptyState />
                            ) : (
                                <div className="space-y-3">
                                    {topProducts.map((p, i) => {
                                        const maxRev = topProducts[0]?.revenue || 1;
                                        return (
                                            <div key={p.name} className="flex items-center gap-3">
                                                <span className="font-heading font-bold text-oliva-400 w-6 text-center">#{i + 1}</span>
                                                <div className="flex-1">
                                                    <p className="font-semibold text-sm text-bark mb-1">{p.name}</p>
                                                    <div className="h-2 bg-sand rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all ${COLORS[i % COLORS.length]}`}
                                                            style={{ width: `${(p.revenue / maxRev) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right min-w-[80px]">
                                                    <p className="font-heading font-bold text-bark">{fmtUsd(p.revenue)}</p>
                                                    <p className="text-xs text-oliva-400">{p.quantity} uds</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </ChartCard>
                    </div>

                    {/* By Category */}
                    <ChartCard title="Por categoría">
                        {byCategory.length === 0 ? (
                            <EmptyState />
                        ) : (
                            <div className="space-y-3">
                                {byCategory.map((c, i) => {
                                    const totalRev = byCategory.reduce((s, x) => s + x.revenue, 0) || 1;
                                    const pct = ((c.revenue / totalRev) * 100).toFixed(1);
                                    return (
                                        <div key={c.name} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2.5 h-2.5 rounded-full ${COLORS[i % COLORS.length]}`} />
                                                <span className="text-sm font-semibold text-bark">{c.name}</span>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-heading font-bold text-bark">{fmtUsd(c.revenue)}</p>
                                                <p className="text-xs text-oliva-400">{pct}%</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </ChartCard>
                </div>
            )}

            {activeTab === 'team' && (
                <ChartCard title="Rendimiento por mesero">
                    {byWaiter.length === 0 ? (
                        <EmptyState />
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                <tr className="border-b-2 border-sand">
                                    <th className="text-left text-xs font-semibold text-oliva-500 py-3 px-3">Empleado</th>
                                    <th className="text-right text-xs font-semibold text-oliva-500 py-3 px-3">Pedidos</th>
                                    <th className="text-right text-xs font-semibold text-oliva-500 py-3 px-3">Ventas</th>
                                    <th className="text-right text-xs font-semibold text-oliva-500 py-3 px-3">Ticket prom.</th>
                                </tr>
                                </thead>
                                <tbody>
                                {byWaiter.map((w, i) => (
                                    <tr key={w.name} className={i % 2 === 0 ? 'bg-white' : 'bg-cream/30'}>
                                        <td className="py-3 px-3">
                                            <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${COLORS[i % COLORS.length]}`}>
                            {w.name.charAt(0)}
                          </span>
                                                <span className="font-semibold text-bark">{w.name}</span>
                                            </div>
                                        </td>
                                        <td className="text-right py-3 px-3 text-bark">{w.count}</td>
                                        <td className="text-right py-3 px-3 font-bold text-bark">{fmtUsd(w.total)}</td>
                                        <td className="text-right py-3 px-3 text-oliva-600">{fmtUsd(w.avgTicket)}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </ChartCard>
            )}
        </div>
    );
}

// ─── Summary Card ───
function SummaryCard({ label, value, change, icon, big }: { label: string; value: string; change?: number; icon: React.ReactNode; big?: boolean }) {
    return (
        <div className={`card ${big ? 'md:col-span-1' : ''}`}>
            <div className="flex items-start justify-between mb-2">
                <span className="text-xs font-semibold text-oliva-500">{label}</span>
                <span className="text-oliva-300">{icon}</span>
            </div>
            <p className={`font-heading font-bold text-bark ${big ? 'text-2xl' : 'text-xl'}`}>{value}</p>
            {change !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-semibold mt-2 ${change >= 0 ? 'text-salvia-600' : 'text-arcilla-600'}`}>
                    {change >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {fmtPct(change)} vs anterior
                </div>
            )}
        </div>
    );
}

// ─── Chart Card ───
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="card">
            <h3 className="font-heading font-bold text-bark mb-4">{title}</h3>
            {children}
        </div>
    );
}

// ─── Empty State ───
function EmptyState() {
    return <div className="text-center py-8 text-oliva-400">Sin datos</div>;
}

// ─── Simple Bar Chart (pure CSS) ───
function BarChart({ data, color }: { data: Array<{ label: string; value: number }>; color: 'salvia' | 'arcilla' | 'miel' }) {
    const max = Math.max(...data.map((d) => d.value), 1);
    const colorMap = { salvia: 'bg-salvia-500', arcilla: 'bg-arcilla-500', miel: 'bg-miel-500' };

    if (data.length === 0) return <EmptyState />;

    return (
        <div className="overflow-x-auto">
            <div className="flex items-end gap-1 min-h-[200px] px-1">
                {data.map((d, i) => (
                    <div key={i} className="flex flex-col items-center flex-1 min-w-[32px]">
            <span className="text-[10px] text-oliva-400 font-semibold mb-1">
              {d.value > 0 ? fmtUsd(d.value) : ''}
            </span>
                        <div
                            className={`w-full max-w-[40px] rounded-t transition-all ${colorMap[color]} ${d.value === 0 ? 'opacity-20' : ''}`}
                            style={{ height: `${Math.max((d.value / max) * 160, d.value > 0 ? 4 : 0)}px` }}
                        />
                        <span className="text-[10px] text-oliva-400 mt-1 text-center whitespace-nowrap">{d.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}