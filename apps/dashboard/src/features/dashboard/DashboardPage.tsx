// ============================================
// REVO — Dashboard Page (Refactored)
// ============================================
// Location: apps/dashboard/src/features/dashboard/DashboardPage.tsx
// ============================================

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '@/hooks/useApi';
import {
    formatCurrency,
    formatRelativeTime,
    ORDER_STATUS_LABELS,
    ORDER_TYPE_ICONS
} from '@/lib/constants';
import {
    DollarSign,
    ShoppingBag,
    Users,
    TrendingUp,
    Clock,
    AlertTriangle,
    ArrowRight,
    RefreshCw,
} from 'lucide-react';

// ─── Types ───
interface Stats {
    todaySales: number;
    todayOrders: number;
    avgTicket: number;
    activeOrders: number;
    occupiedTables: number;
    totalTables: number;
    topProducts: { name: string; quantity: number }[];
}

interface RecentOrder {
    id: string;
    orderNumber: number;
    type: string;
    status: string;
    total: number;
    tableNumber: string | null;
    itemCount: number;
    createdAt: string;
}

interface Alert {
    id: string;
    name: string;
    currentStock: number;
    minStock: number;
}

// ─── Component ───
export default function DashboardPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const { get } = useApi();
    const navigate = useNavigate();

    const loadData = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true);

        try {
            const [statsData, ordersData, alertsData] = await Promise.all([
                get<Stats>('/dashboard/stats'),
                get<RecentOrder[]>('/dashboard/recent-orders'),
                get<Alert[]>('/inventory/alerts').catch(() => []), // Optional
            ]);

            setStats(statsData);
            setRecentOrders(ordersData);
            setAlerts(alertsData.slice(0, 3)); // Top 3 alerts
        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(() => loadData(), 30000);
        return () => clearInterval(interval);
    }, []);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Buenos días';
        if (hour < 18) return 'Buenas tardes';
        return 'Buenas noches';
    };

    const occupancyPercent = stats && stats.totalTables > 0
        ? Math.round((stats.occupiedTables / stats.totalTables) * 100)
        : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <RefreshCw className="w-8 h-8 text-salvia-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* ── Header ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-oliva-900">
                        {getGreeting()} 👋
                    </h1>
                    <p className="text-sm text-oliva-500 mt-1">
                        {new Date().toLocaleDateString('es-VE', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long'
                        })}
                    </p>
                </div>
                <button
                    onClick={() => loadData(true)}
                    disabled={refreshing}
                    className="btn btn-outline gap-2"
                >
                    <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Actualizar
                </button>
            </div>

            {/* ── Stats Grid ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={<DollarSign className="w-5 h-5" />}
                    iconBg="bg-salvia-100"
                    iconColor="text-salvia-600"
                    label="Ventas de hoy"
                    value={formatCurrency(stats?.todaySales ?? 0)}
                />
                <StatCard
                    icon={<ShoppingBag className="w-5 h-5" />}
                    iconBg="bg-arcilla-100"
                    iconColor="text-arcilla-600"
                    label="Pedidos"
                    value={String(stats?.todayOrders ?? 0)}
                    sub={`${stats?.activeOrders ?? 0} activos`}
                />
                <StatCard
                    icon={<Users className="w-5 h-5" />}
                    iconBg="bg-miel-100"
                    iconColor="text-miel-600"
                    label="Mesas ocupadas"
                    value={`${stats?.occupiedTables ?? 0} / ${stats?.totalTables ?? 0}`}
                    sub={`${occupancyPercent}% ocupación`}
                />
                <StatCard
                    icon={<TrendingUp className="w-5 h-5" />}
                    iconBg="bg-oliva-100"
                    iconColor="text-oliva-600"
                    label="Ticket promedio"
                    value={formatCurrency(stats?.avgTicket ?? 0)}
                />
            </div>

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Orders */}
                <div className="lg:col-span-2 card">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-heading font-bold text-oliva-900">
                            Pedidos recientes
                        </h2>
                        <button
                            onClick={() => navigate('/orders')}
                            className="text-sm text-arcilla-500 hover:text-arcilla-600 font-medium flex items-center gap-1"
                        >
                            Ver todos <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {recentOrders.length === 0 ? (
                        <div className="text-center py-8 text-oliva-400">
                            <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>No hay pedidos recientes</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {recentOrders.map((order) => (
                                <div
                                    key={order.id}
                                    onClick={() => navigate('/orders')}
                                    className="flex items-center justify-between p-3 rounded-lg bg-sand/50 hover:bg-sand cursor-pointer transition-colors"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-lg">{ORDER_TYPE_ICONS[order.type]}</span>
                                        <div>
                                            <div className="font-semibold text-oliva-900">
                                                #{order.orderNumber}
                                                {order.tableNumber && (
                                                    <span className="text-oliva-500 font-normal ml-2">
                            Mesa {order.tableNumber}
                          </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-oliva-400 flex items-center gap-2">
                                                <Clock className="w-3 h-3" />
                                                {formatRelativeTime(order.createdAt)}
                                                <span>•</span>
                                                {order.itemCount} items
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-oliva-900">
                                            {formatCurrency(order.total)}
                                        </div>
                                        <span className={`badge badge-${order.status.toLowerCase()}`}>
                      {ORDER_STATUS_LABELS[order.status]}
                    </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Top Products */}
                    <div className="card">
                        <h3 className="font-heading font-bold text-oliva-900 mb-4">
                            Top productos hoy
                        </h3>
                        {stats?.topProducts && stats.topProducts.length > 0 ? (
                            <div className="space-y-3">
                                {stats.topProducts.slice(0, 5).map((product, i) => (
                                    <div key={i} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-salvia-100 text-salvia-600 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                                            <span className="text-sm text-oliva-700 truncate max-w-[140px]">
                        {product.name}
                      </span>
                                        </div>
                                        <span className="text-sm font-semibold text-oliva-900">
                      {product.quantity}
                    </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-oliva-400 text-center py-4">
                                Sin datos aún
                            </p>
                        )}
                    </div>

                    {/* Inventory Alerts */}
                    {alerts.length > 0 && (
                        <div className="card border-l-4 border-l-arcilla-500">
                            <div className="flex items-center gap-2 mb-3">
                                <AlertTriangle className="w-5 h-5 text-arcilla-500" />
                                <h3 className="font-heading font-bold text-oliva-900">
                                    Alertas de stock
                                </h3>
                            </div>
                            <div className="space-y-2">
                                {alerts.map((alert) => (
                                    <div
                                        key={alert.id}
                                        className="flex items-center justify-between text-sm"
                                    >
                    <span className="text-oliva-700 truncate max-w-[150px]">
                      {alert.name}
                    </span>
                                        <span className="text-arcilla-600 font-medium">
                      {alert.currentStock} / {alert.minStock}
                    </span>
                                    </div>
                                ))}
                            </div>
                            <button
                                onClick={() => navigate('/inventory')}
                                className="mt-3 text-sm text-arcilla-500 hover:text-arcilla-600 font-medium flex items-center gap-1"
                            >
                                Ver inventario <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Quick Actions */}
                    <div className="card">
                        <h3 className="font-heading font-bold text-oliva-900 mb-4">
                            Acciones rápidas
                        </h3>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                onClick={() => navigate('/pos')}
                                className="btn btn-primary text-xs py-3"
                            >
                                Nuevo pedido
                            </button>
                            <button
                                onClick={() => navigate('/tables')}
                                className="btn btn-secondary text-xs py-3"
                            >
                                Ver mesas
                            </button>
                            <button
                                onClick={() => navigate('/kds')}
                                className="btn btn-outline text-xs py-3"
                            >
                                Cocina
                            </button>
                            <button
                                onClick={() => navigate('/reports')}
                                className="btn btn-outline text-xs py-3"
                            >
                                Reportes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Stat Card Component ───
interface StatCardProps {
    icon: React.ReactNode;
    iconBg: string;
    iconColor: string;
    label: string;
    value: string;
    sub?: string;
}

function StatCard({ icon, iconBg, iconColor, label, value, sub }: StatCardProps) {
    return (
        <div className="card flex items-start gap-4">
            <div className={`p-3 rounded-xl ${iconBg} ${iconColor}`}>
                {icon}
            </div>
            <div>
                <p className="text-xs font-medium text-oliva-500 uppercase tracking-wide">
                    {label}
                </p>
                <p className="text-2xl font-heading font-bold text-oliva-900 mt-1">
                    {value}
                </p>
                {sub && (
                    <p className="text-xs text-oliva-400 mt-1">{sub}</p>
                )}
            </div>
        </div>
    );
}