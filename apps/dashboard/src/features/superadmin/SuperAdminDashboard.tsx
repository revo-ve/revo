// ============================================
// REVO — Super Admin Dashboard
// ============================================
// Location: apps/dashboard/src/features/superadmin/SuperAdminDashboard.tsx
// ============================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  ShoppingCart,
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';

// ─── Types ───
interface DashboardStats {
  totalTenants: number;
  activeTenants: number;
  inactiveTenants: number;
  totalUsers: number;
  totalOrders: number;
  tenantsThisMonth: number;
  recentTenants: {
    id: string;
    name: string;
    createdAt: string;
    usersCount: number;
  }[];
}

// ─── Stat Card ───
function StatCard({
  title,
  value,
  icon: Icon,
  color,
  subtitle,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function SuperAdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { get } = useApi();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await get<DashboardStats>('/superadmin/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Vista general de todos los restaurantes
          </p>
        </div>
        <Link
          to="/superadmin/tenants/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-colors"
        >
          <Plus size={18} />
          Nuevo Restaurante
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Restaurantes"
          value={stats?.totalTenants || 0}
          icon={Building2}
          color="#7C3AED"
          subtitle={`${stats?.activeTenants || 0} activos`}
        />
        <StatCard
          title="Usuarios Totales"
          value={stats?.totalUsers || 0}
          icon={Users}
          color="#2563EB"
        />
        <StatCard
          title="Pedidos Totales"
          value={stats?.totalOrders || 0}
          icon={ShoppingCart}
          color="#059669"
        />
        <StatCard
          title="Nuevos este mes"
          value={stats?.tenantsThisMonth || 0}
          icon={TrendingUp}
          color="#D97706"
        />
      </div>

      {/* Recent Tenants */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Restaurantes Recientes</h2>
          <Link
            to="/superadmin/tenants"
            className="text-sm text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
          >
            Ver todos
            <ArrowRight size={16} />
          </Link>
        </div>

        {stats?.recentTenants && stats.recentTenants.length > 0 ? (
          <div className="divide-y divide-slate-100">
            {stats.recentTenants.map((tenant) => (
              <Link
                key={tenant.id}
                to={`/superadmin/tenants/${tenant.id}`}
                className="flex items-center justify-between px-5 py-4 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Building2 size={20} className="text-violet-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{tenant.name}</p>
                    <p className="text-sm text-slate-500">
                      {tenant.usersCount} usuario{tenant.usersCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Calendar size={14} />
                  {new Date(tenant.createdAt).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="px-5 py-12 text-center">
            <Building2 size={48} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500">No hay restaurantes aún</p>
            <Link
              to="/superadmin/tenants/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus size={16} />
              Crear primero
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
