// ============================================
// REVO — Tenant Detail Page (Super Admin)
// ============================================
// Location: apps/dashboard/src/features/superadmin/TenantDetailPage.tsx
// ============================================

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Building2,
  ArrowLeft,
  Users,
  ShoppingBag,
  FolderOpen,
  ShoppingCart,
  ExternalLink,
  Mail,
  Clock,
  CheckCircle,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Pencil,
  Save,
  X,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';

// ─── Types ───
interface TenantDetail {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  users: {
    id: string;
    name: string;
    email: string;
    isActive: boolean;
    isPending: boolean;
    createdAt: string;
    role: {
      id: string;
      name: string;
      color: string;
    };
  }[];
  roles: {
    id: string;
    name: string;
    color: string;
    usersCount: number;
  }[];
  stats: {
    categories: number;
    products: number;
    orders: number;
  };
}

export default function TenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const { get, put, patch } = useApi();
  const { success, error } = useToast();

  const fetchTenant = async () => {
    try {
      const data = await get<TenantDetail>(`/superadmin/tenants/${id}`);
      setTenant(data);
      setEditName(data.name);
      setEditSlug(data.slug);
    } catch (err: any) {
      error(err.message || 'Error al cargar el restaurante');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchTenant();
  }, [id]);

  const handleSave = async () => {
    if (!editName.trim() || !editSlug.trim()) {
      error('Nombre y slug son obligatorios');
      return;
    }

    setIsSaving(true);
    try {
      await put(`/superadmin/tenants/${id}`, {
        name: editName.trim(),
        slug: editSlug.trim().toLowerCase(),
      });
      success('Restaurante actualizado');
      setIsEditing(false);
      fetchTenant();
    } catch (err: any) {
      error(err.message || 'Error al actualizar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStatus = async () => {
    setIsToggling(true);
    try {
      await patch(`/superadmin/tenants/${id}/toggle-status`, {});
      success(tenant?.isActive ? 'Restaurante desactivado' : 'Restaurante activado');
      fetchTenant();
    } catch (err: any) {
      error(err.message || 'Error al cambiar estado');
    } finally {
      setIsToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-violet-200 border-t-violet-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="text-center py-12">
        <Building2 size={48} className="mx-auto text-slate-300 mb-3" />
        <h3 className="font-semibold text-slate-900">Restaurante no encontrado</h3>
        <Link
          to="/superadmin/tenants"
          className="inline-flex items-center gap-2 mt-4 text-violet-600 hover:text-violet-700"
        >
          <ArrowLeft size={16} />
          Volver a restaurantes
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Back link */}
      <Link
        to="/superadmin/tenants"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        Volver a restaurantes
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-xl flex items-center justify-center ${
                tenant.isActive ? 'bg-violet-100' : 'bg-slate-100'
              }`}
            >
              <Building2
                size={32}
                className={tenant.isActive ? 'text-violet-600' : 'text-slate-400'}
              />
            </div>
            <div>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-xl font-bold px-3 py-1 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                  />
                  <div className="flex items-center">
                    <span className="text-sm text-slate-500 mr-1">/menu/</span>
                    <input
                      type="text"
                      value={editSlug}
                      onChange={(e) =>
                        setEditSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                      }
                      className="text-sm px-2 py-1 border border-slate-200 rounded-lg focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-slate-900">{tenant.name}</h1>
                  <p className="text-slate-500">/menu/{tenant.slug}</p>
                </>
              )}
              <div className="flex items-center gap-2 mt-2">
                {tenant.isActive ? (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-lg">
                    <CheckCircle size={12} />
                    Activo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                    Inactivo
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditName(tenant.name);
                    setEditSlug(tenant.slug);
                  }}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  {isSaving ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : (
                    <Save size={18} />
                  )}
                  Guardar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
                  title="Editar"
                >
                  <Pencil size={18} />
                </button>
                <button
                  onClick={handleToggleStatus}
                  disabled={isToggling}
                  className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                    tenant.isActive
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  }`}
                >
                  {isToggling ? (
                    <RefreshCw size={18} className="animate-spin" />
                  ) : tenant.isActive ? (
                    <ToggleLeft size={18} />
                  ) : (
                    <ToggleRight size={18} />
                  )}
                  {tenant.isActive ? 'Desactivar' : 'Activar'}
                </button>
                <a
                  href={`/menu/${tenant.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors flex items-center gap-2"
                >
                  <ExternalLink size={18} />
                  Ver menú
                </a>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <Users size={24} className="mx-auto text-violet-600 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{tenant.users.length}</p>
          <p className="text-sm text-slate-500">Usuarios</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <FolderOpen size={24} className="mx-auto text-blue-600 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{tenant.stats.categories}</p>
          <p className="text-sm text-slate-500">Categorías</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <ShoppingBag size={24} className="mx-auto text-green-600 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{tenant.stats.products}</p>
          <p className="text-sm text-slate-500">Productos</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <ShoppingCart size={24} className="mx-auto text-orange-600 mb-2" />
          <p className="text-2xl font-bold text-slate-900">{tenant.stats.orders}</p>
          <p className="text-sm text-slate-500">Pedidos</p>
        </div>
      </div>

      {/* Users */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h2 className="font-semibold text-slate-900">Usuarios ({tenant.users.length})</h2>
        </div>

        {tenant.users.length === 0 ? (
          <div className="p-8 text-center">
            <Users size={40} className="mx-auto text-slate-300 mb-2" />
            <p className="text-slate-500">No hay usuarios registrados</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {tenant.users.map((user) => (
              <div
                key={user.id}
                className={`px-6 py-4 flex items-center justify-between ${
                  !user.isActive && !user.isPending ? 'opacity-50' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold relative"
                    style={{ backgroundColor: user.role?.color || '#6B8F71' }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                    {user.isPending && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
                        <Clock size={10} className="text-amber-900" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900">{user.name}</p>
                      {user.isPending && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">
                          Pendiente
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-500">{user.email}</p>
                  </div>
                </div>
                <span
                  className="px-2.5 py-1 text-xs font-medium text-white rounded-lg"
                  style={{ backgroundColor: user.role?.color || '#6B8F71' }}
                >
                  {user.role?.name || 'Sin rol'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="mt-6 text-sm text-slate-400">
        <p>
          Creado el{' '}
          {new Date(tenant.createdAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
        <p>
          Última actualización{' '}
          {new Date(tenant.updatedAt).toLocaleDateString('es-ES', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}
