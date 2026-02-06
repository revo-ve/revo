// ============================================
// REVO — Roles Page (Consistent with MenuPage)
// ============================================
// Location: apps/dashboard/src/features/roles/RolesPage.tsx
// ============================================

import { useState, useEffect, useMemo } from 'react';
import {
    Plus,
    Pencil,
    Trash2,
    ChevronDown,
    ChevronRight,
    Shield,
    Search,
    Copy,
    Star,
    Users,
    Check,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';
import Modal, { ModalInput, ModalButton } from '../../components/ui/Modal';

// ─── Types ───
interface Permission {
    id: string;
    code: string;
    name: string;
    module: string;
    description: string | null;
}

interface Role {
    id: string;
    name: string;
    description: string | null;
    color: string;
    isDefault: boolean;
    _count: { users: number; permissions: number };
}

interface RoleDetail extends Role {
    permissionIds: string[];
    permissionCodes: string[];
}

// Module labels
const MODULE_LABELS: Record<string, { label: string; icon: string }> = {
    dashboard: { label: 'Dashboard', icon: '📊' },
    menu: { label: 'Menú', icon: '🍽️' },
    tables: { label: 'Mesas', icon: '🪑' },
    orders: { label: 'Pedidos', icon: '📋' },
    pos: { label: 'Punto de Venta', icon: '💳' },
    kds: { label: 'Cocina', icon: '👨‍🍳' },
    reports: { label: 'Reportes', icon: '📈' },
    inventory: { label: 'Inventario', icon: '📦' },
    users: { label: 'Equipo', icon: '👥' },
    roles: { label: 'Roles', icon: '🔐' },
    qr: { label: 'Carta Digital', icon: '📱' },
    settings: { label: 'Configuración', icon: '⚙️' },
};

const COLORS = [
    '#3D4F2F', '#5F7161', '#6B8F71', '#C8553D',
    '#D4A574', '#8B6914', '#4A5C45', '#2563EB', '#7C3AED'
];

// ─── Role Card ───
function RoleCard({
                      role,
                      onEdit,
                      onDuplicate,
                      onSetDefault,
                      onDelete,
                  }: {
    role: Role;
    onEdit: () => void;
    onDuplicate: () => void;
    onSetDefault: () => void;
    onDelete: () => void;
}) {
    return (
        <div className="card-hover flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                    className="w-10 h-10 rounded-revo flex items-center justify-center text-white font-bold shrink-0"
                    style={{ backgroundColor: role.color }}
                >
                    {role.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h4 className="font-ui font-semibold text-bark truncate">{role.name}</h4>
                        {role.isDefault && (
                            <span className="badge bg-miel-100 text-miel-700">Default</span>
                        )}
                    </div>
                    {role.description && (
                        <p className="text-sm text-oliva-500 mt-0.5 line-clamp-1">{role.description}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-3 text-sm text-oliva-500">
          <span className="flex items-center gap-1">
            <Users size={14} className="text-oliva-400" />
              {role._count.users}
          </span>
                    <span className="flex items-center gap-1">
            <Shield size={14} className="text-oliva-400" />
                        {role._count.permissions}
          </span>
                </div>
                <div className="flex items-center gap-1">
                    <button
                        onClick={onEdit}
                        className="p-1.5 rounded-revo-sm hover:bg-sand transition-colors"
                        title="Editar"
                    >
                        <Pencil size={16} className="text-oliva-500" />
                    </button>
                    <button
                        onClick={onDuplicate}
                        className="p-1.5 rounded-revo-sm hover:bg-sand transition-colors"
                        title="Duplicar"
                    >
                        <Copy size={16} className="text-oliva-500" />
                    </button>
                    {!role.isDefault && (
                        <button
                            onClick={onSetDefault}
                            className="p-1.5 rounded-revo-sm hover:bg-miel-50 transition-colors"
                            title="Marcar como predeterminado"
                        >
                            <Star size={16} className="text-oliva-400" />
                        </button>
                    )}
                    {role._count.users === 0 && (
                        <button
                            onClick={onDelete}
                            className="p-1.5 rounded-revo-sm hover:bg-arcilla-50 transition-colors"
                            title="Eliminar"
                        >
                            <Trash2 size={16} className="text-arcilla-400" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───
export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal states
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState<Role | null>(null);
    const [editingRole, setEditingRole] = useState<RoleDetail | null>(null);

    // Form states
    const [roleName, setRoleName] = useState('');
    const [roleDesc, setRoleDesc] = useState('');
    const [roleColor, setRoleColor] = useState(COLORS[2]);
    const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());
    const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
    const [permSearch, setPermSearch] = useState('');

    const { get, post, put, del } = useApi();
    const { success, error } = useToast();

    // ─── Fetch Data ───
    const fetchData = async () => {
        try {
            const [rolesRes, permsRes] = await Promise.all([
                get<any>('/roles'),
                get<any>('/roles/permissions'),
            ]);
            setRoles(rolesRes?.data || rolesRes || []);
            setPermissions(permsRes?.data || permsRes || []);
        } catch (err: any) {
            error(err.message || 'Error al cargar roles');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Group permissions by module
    const permissionsByModule = useMemo(() => {
        const grouped: Record<string, Permission[]> = {};
        for (const perm of permissions) {
            if (!grouped[perm.module]) grouped[perm.module] = [];
            grouped[perm.module].push(perm);
        }
        return grouped;
    }, [permissions]);

    // Filter roles by search
    const filteredRoles = useMemo(() => {
        if (!searchQuery) return roles;
        const q = searchQuery.toLowerCase();
        return roles.filter(
            (r) =>
                r.name.toLowerCase().includes(q) ||
                r.description?.toLowerCase().includes(q)
        );
    }, [roles, searchQuery]);

    // Filter modules by permission search
    const filteredModules = useMemo(() => {
        return Object.entries(permissionsByModule).filter(([module, perms]) => {
            if (!permSearch) return true;
            const q = permSearch.toLowerCase();
            const moduleInfo = MODULE_LABELS[module];
            return (
                moduleInfo?.label.toLowerCase().includes(q) ||
                perms.some((p) => p.name.toLowerCase().includes(q))
            );
        });
    }, [permissionsByModule, permSearch]);

    // ─── Role CRUD ───
    const openNewRole = () => {
        setEditingRole(null);
        setRoleName('');
        setRoleDesc('');
        setRoleColor(COLORS[2]);
        setSelectedPerms(new Set());
        setExpandedModules(new Set());
        setPermSearch('');
        setShowRoleModal(true);
    };

    const openEditRole = async (roleId: string) => {
        try {
            const res = await get<any>(`/roles/${roleId}`);
            const roleDetail = res?.data || res;
            setEditingRole(roleDetail);
            setRoleName(roleDetail.name);
            setRoleDesc(roleDetail.description || '');
            setRoleColor(roleDetail.color);
            setSelectedPerms(new Set(roleDetail.permissionIds || []));
            setExpandedModules(new Set());
            setPermSearch('');
            setShowRoleModal(true);
        } catch {
            error('Error al cargar el rol');
        }
    };

    const saveRole = async () => {
        if (!roleName.trim()) {
            error('El nombre es obligatorio');
            return;
        }

        try {
            const payload = {
                name: roleName.trim(),
                description: roleDesc.trim() || null,
                color: roleColor,
                permissionIds: Array.from(selectedPerms),
            };

            if (editingRole) {
                await put(`/roles/${editingRole.id}`, payload);
                success('Rol actualizado');
            } else {
                await post('/roles', payload);
                success('Rol creado');
            }
            setShowRoleModal(false);
            fetchData();
        } catch (err: any) {
            error(err.message || 'Error al guardar');
        }
    };

    const duplicateRole = async (role: Role) => {
        const newName = prompt(`Nombre para la copia de "${role.name}":`, `${role.name} (copia)`);
        if (!newName) return;

        try {
            await post(`/roles/${role.id}/duplicate`, { name: newName });
            success('Rol duplicado');
            fetchData();
        } catch (err: any) {
            error(err.message || 'Error al duplicar');
        }
    };

    const setDefaultRole = async (roleId: string) => {
        try {
            await post(`/roles/${roleId}/set-default`, {});
            success('Rol predeterminado actualizado');
            fetchData();
        } catch (err: any) {
            error(err.message || 'Error al actualizar');
        }
    };

    const deleteRole = async () => {
        if (!showDeleteModal) return;

        try {
            await del(`/roles/${showDeleteModal.id}`);
            success('Rol eliminado');
            setShowDeleteModal(null);
            fetchData();
        } catch (err: any) {
            error(err.message || 'Error al eliminar');
        }
    };

    // ─── Permission Helpers ───
    const toggleModule = (module: string) => {
        setExpandedModules((prev) => {
            const next = new Set(prev);
            next.has(module) ? next.delete(module) : next.add(module);
            return next;
        });
    };

    const togglePermission = (id: string) => {
        setSelectedPerms((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleAllModule = (module: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const modulePerms = permissionsByModule[module] || [];
        const allSelected = modulePerms.every((p) => selectedPerms.has(p.id));

        setSelectedPerms((prev) => {
            const next = new Set(prev);
            for (const perm of modulePerms) {
                if (allSelected) next.delete(perm.id);
                else next.add(perm.id);
            }
            return next;
        });
    };

    const selectAllPerms = () => setSelectedPerms(new Set(permissions.map((p) => p.id)));
    const selectNonePerms = () => setSelectedPerms(new Set());

    // ─── Render ───
    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-10 h-10 border-4 border-sand border-t-salvia-500 rounded-full animate-spin" />
            </div>
        );
    }

    const totalProducts = roles.reduce((acc, r) => acc + r._count.permissions, 0);

    return (
        <div className="p-4 md:p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-bark">Roles y Permisos</h1>
                    <p className="text-sm text-oliva-500 mt-0.5">
                        {roles.length} {roles.length === 1 ? 'rol' : 'roles'}
                    </p>
                </div>
                <button onClick={openNewRole} className="btn btn-primary">
                    <Plus size={18} />
                    Nuevo rol
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-oliva-400" />
                <input
                    type="text"
                    placeholder="Buscar rol..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10"
                />
            </div>

            {/* Roles List */}
            {filteredRoles.length === 0 ? (
                <div className="card text-center py-12">
                    <Shield size={48} className="mx-auto text-oliva-300 mb-3" />
                    <h3 className="font-heading font-semibold text-bark">
                        {searchQuery ? 'Sin resultados' : 'Sin roles'}
                    </h3>
                    <p className="text-sm text-oliva-500 mt-1">
                        {searchQuery
                            ? 'Intenta con otra búsqueda'
                            : 'Crea tu primer rol para gestionar permisos'}
                    </p>
                    {!searchQuery && (
                        <button onClick={openNewRole} className="btn btn-primary mt-4">
                            <Plus size={18} />
                            Nuevo rol
                        </button>
                    )}
                </div>
            ) : (
                <div className="card !p-0 overflow-hidden">
                    <div className="divide-y divide-sand">
                        {filteredRoles.map((role) => (
                            <div key={role.id} className="px-5 py-3">
                                <RoleCard
                                    role={role}
                                    onEdit={() => openEditRole(role.id)}
                                    onDuplicate={() => duplicateRole(role)}
                                    onSetDefault={() => setDefaultRole(role.id)}
                                    onDelete={() => setShowDeleteModal(role)}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Role Modal ── */}
            <Modal
                isOpen={showRoleModal}
                onClose={() => setShowRoleModal(false)}
                title={editingRole ? 'Editar rol' : 'Nuevo rol'}
                size="lg"
                footer={
                    <>
                        <ModalButton variant="secondary" onClick={() => setShowRoleModal(false)}>
                            Cancelar
                        </ModalButton>
                        <ModalButton onClick={saveRole} disabled={!roleName.trim()}>
                            {editingRole ? 'Guardar' : 'Crear'}
                        </ModalButton>
                    </>
                }
            >
                <div className="space-y-4">
                    {/* Name & Color */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <ModalInput
                            label="Nombre"
                            value={roleName}
                            onChange={setRoleName}
                            placeholder="Ej: Gerente de turno"
                            required
                        />
                        <div>
                            <label className="label">Color</label>
                            <div className="flex gap-2 flex-wrap">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setRoleColor(c)}
                                        className={`w-8 h-8 rounded-revo transition-all ${
                                            roleColor === c
                                                ? 'ring-2 ring-offset-2 ring-bark scale-110'
                                                : 'hover:scale-105'
                                        }`}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <ModalInput
                        label="Descripción (opcional)"
                        value={roleDesc}
                        onChange={setRoleDesc}
                        placeholder="Breve descripción del rol"
                    />

                    {/* Permissions */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="label mb-0">
                                Permisos ({selectedPerms.size} de {permissions.length})
                            </label>
                            <div className="flex gap-2 text-xs">
                                <button
                                    type="button"
                                    onClick={selectAllPerms}
                                    className="text-salvia-600 hover:underline"
                                >
                                    Todos
                                </button>
                                <span className="text-oliva-300">|</span>
                                <button
                                    type="button"
                                    onClick={selectNonePerms}
                                    className="text-arcilla-500 hover:underline"
                                >
                                    Ninguno
                                </button>
                            </div>
                        </div>

                        {/* Permission Search */}
                        <div className="relative mb-3">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-oliva-400" />
                            <input
                                type="text"
                                placeholder="Buscar permisos..."
                                value={permSearch}
                                onChange={(e) => setPermSearch(e.target.value)}
                                className="input pl-9 py-2 text-sm"
                            />
                        </div>

                        {/* Permission Groups */}
                        <div className="border border-sand rounded-revo max-h-[280px] overflow-y-auto">
                            {filteredModules.map(([module, perms]) => {
                                const isExpanded = expandedModules.has(module);
                                const selectedInModule = perms.filter((p) => selectedPerms.has(p.id)).length;
                                const allSelected = selectedInModule === perms.length;
                                const moduleInfo = MODULE_LABELS[module] || { label: module, icon: '📁' };

                                return (
                                    <div key={module} className="border-b border-sand last:border-b-0">
                                        {/* Module Header */}
                                        <div
                                            className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-sand/50 transition-colors"
                                            onClick={() => toggleModule(module)}
                                        >
                                            <div className="flex items-center gap-3">
                                                {isExpanded ? (
                                                    <ChevronDown size={16} className="text-oliva-400" />
                                                ) : (
                                                    <ChevronRight size={16} className="text-oliva-400" />
                                                )}
                                                <span className="text-base">{moduleInfo.icon}</span>
                                                <span className="font-medium text-bark">{moduleInfo.label}</span>
                                                <span className="badge bg-salvia-100 text-salvia-700 text-xs">
                          {selectedInModule}/{perms.length}
                        </span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={(e) => toggleAllModule(module, e)}
                                                className={`text-xs px-2 py-1 rounded-revo-sm font-medium transition-colors ${
                                                    allSelected
                                                        ? 'bg-salvia-100 text-salvia-700 hover:bg-salvia-200'
                                                        : 'bg-sand text-oliva-600 hover:bg-oliva-100'
                                                }`}
                                            >
                                                {allSelected ? 'Quitar' : 'Todos'}
                                            </button>
                                        </div>

                                        {/* Permissions */}
                                        {isExpanded && (
                                            <div className="px-4 py-2 space-y-1 bg-cream/30">
                                                {perms.map((perm) => (
                                                    <label
                                                        key={perm.id}
                                                        className="flex items-start gap-3 py-2 px-3 rounded-revo-sm hover:bg-white cursor-pointer transition-colors"
                                                    >
                                                        <div className="pt-0.5">
                                                            <div
                                                                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                                                    selectedPerms.has(perm.id)
                                                                        ? 'bg-salvia-500 border-salvia-500'
                                                                        : 'border-oliva-300 hover:border-oliva-400'
                                                                }`}
                                                            >
                                                                {selectedPerms.has(perm.id) && (
                                                                    <Check size={14} className="text-white" />
                                                                )}
                                                            </div>
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedPerms.has(perm.id)}
                                                                onChange={() => togglePermission(perm.id)}
                                                                className="sr-only"
                                                            />
                                                        </div>
                                                        <div className="flex-1">
                                                            <span className="text-sm font-medium text-bark">{perm.name}</span>
                                                            {perm.description && (
                                                                <p className="text-xs text-oliva-400 mt-0.5">{perm.description}</p>
                                                            )}
                                                        </div>
                                                    </label>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ── Delete Modal ── */}
            <Modal
                isOpen={!!showDeleteModal}
                onClose={() => setShowDeleteModal(null)}
                title="Eliminar rol"
                size="sm"
                footer={
                    <>
                        <ModalButton variant="secondary" onClick={() => setShowDeleteModal(null)}>
                            Cancelar
                        </ModalButton>
                        <ModalButton variant="danger" onClick={deleteRole}>
                            Sí, eliminar
                        </ModalButton>
                    </>
                }
            >
                <p className="text-oliva-600">
                    ¿Estás seguro de que quieres eliminar el rol{' '}
                    <strong className="text-bark">{showDeleteModal?.name}</strong>?
                </p>
            </Modal>
        </div>
    );
}