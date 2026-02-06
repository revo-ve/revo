// ============================================
// REVO — Tenants List Page (Super Admin)
// ============================================
// Location: apps/dashboard/src/features/superadmin/TenantsListPage.tsx
// ============================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  Users,
  ShoppingCart,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';

// ─── Types ───
interface Tenant {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  stats: {
    users: number;
    categories: number;
    products: number;
    orders: number;
  };
}

// ─── Tenant Card ───
function TenantCard({
  tenant,
  onToggleStatus,
  isToggling,
}: {
  tenant: Tenant;
  onToggleStatus: () => void;
  isToggling: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border shadow-sm overflow-hidden transition-opacity ${
        !tenant.isActive ? 'opacity-60 border-slate-200' : 'border-slate-200'
      }`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                tenant.isActive ? 'bg-violet-100' : 'bg-slate-100'
              }`}
            >
              <Building2
                size={24}
                className={tenant.isActive ? 'text-violet-600' : 'text-slate-400'}
              />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{tenant.name}</h3>
              <p className="text-sm text-slate-500">/{tenant.slug}</p>
            </div>
          </div>
          <button
            onClick={onToggleStatus}
            disabled={isToggling}
            className={`p-1.5 rounded-lg transition-colors ${
              tenant.isActive
                ? 'text-green-600 hover:bg-green-50'
                : 'text-slate-400 hover:bg-slate-100'
            }`}
            title={tenant.isActive ? 'Desactivar' : 'Activar'}
          >
            {tenant.isActive ? (
              <ToggleRight size={28} />
            ) : (
              <ToggleLeft size={28} />
            )}
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-lg font-bold text-slate-900">{tenant.stats.users}</p>
            <p className="text-xs text-slate-500">Usuarios</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-lg font-bold text-slate-900">{tenant.stats.products}</p>
            <p className="text-xs text-slate-500">Productos</p>
          </div>
          <div className="text-center p-2 bg-slate-50 rounded-lg">
            <p className="text-lg font-bold text-slate-900">{tenant.stats.orders}</p>
            <p className="text-xs text-slate-500">Pedidos</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to={`/superadmin/tenants/${tenant.id}`}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Ver detalle
          </Link>
          <a
            href={`/menu/${tenant.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-medium rounded-lg transition-colors"
            title="Ver menú digital"
          >
            <ExternalLink size={16} />
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-slate-50 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          Creado el{' '}
          {new Date(tenant.createdAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}

// ─── Main Component ───
export default function TenantsListPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { get, patch } = useApi();
  const { success, error } = useToast();

  const fetchTenants = async () => {
    try {
      const data = await get<Tenant[]>('/superadmin/tenants');
      setTenants(data);
    } catch (err: any) {
      error(err.message || 'Error al cargar restaurantes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const toggleStatus = async (tenantId: string) => {
    setTogglingId(tenantId);
    try {
      await patch(`/superadmin/tenants/${tenantId}/toggle-status`, {});
      success('Estado actualizado');
      fetchTenants();
    } catch (err: any) {
      error(err.message || 'Error al cambiar estado');
    } finally {
      setTogglingId(null);
    }
  };

  // Filter and search
  const filteredTenants = tenants.filter((tenant) => {
    // Apply status filter
    if (filter === 'active' && !tenant.isActive) return false;
    if (filter === 'inactive' && tenant.isActive) return false;

    // Apply search
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      tenant.name.toLowerCase().includes(q) ||
      tenant.slug.toLowerCase().includes(q)
    );
  });

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
          <h1 className="text-2xl font-bold text-slate-900">Restaurantes</h1>
          <p className="text-sm text-slate-500 mt-1">
            {tenants.length} restaurante{tenants.length !== 1 ? 's' : ''} registrado{tenants.length !== 1 ? 's' : ''}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            placeholder="Buscar por nombre o slug..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                filter === f
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : 'Inactivos'}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filteredTenants.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <Building2 size={48} className="mx-auto text-slate-300 mb-3" />
          <h3 className="font-semibold text-slate-900">
            {searchQuery || filter !== 'all'
              ? 'Sin resultados'
              : 'No hay restaurantes'}
          </h3>
          <p className="text-sm text-slate-500 mt-1">
            {searchQuery || filter !== 'all'
              ? 'Intenta con otra búsqueda o filtro'
              : 'Crea el primer restaurante para empezar'}
          </p>
          {!searchQuery && filter === 'all' && (
            <Link
              to="/superadmin/tenants/new"
              className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-lg transition-colors"
            >
              <Plus size={16} />
              Nuevo Restaurante
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map((tenant) => (
            <TenantCard
              key={tenant.id}
              tenant={tenant}
              onToggleStatus={() => toggleStatus(tenant.id)}
              isToggling={togglingId === tenant.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
