// ============================================
// REVO — Users Page (with Email Invitations)
// ============================================
// Location: apps/dashboard/src/features/users/UsersPage.tsx
// ============================================

import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  Search,
  Mail,
  RefreshCw,
  Clock,
  KeyRound,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermissions';
import Modal, { ModalInput, ModalButton } from '../../components/ui/Modal';

// ─── Types ───
interface Role {
  id: string;
  name: string;
  color: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  isPending?: boolean; // Has pending invitation
  createdAt: string;
}

// ─── User Card ───
function UserCard({
  user,
  onEdit,
  onDelete,
  onResendInvite,
  onResetPassword,
  canEdit,
  canDelete,
  canAssignRole,
  isResending,
}: {
  user: User;
  onEdit: () => void;
  onDelete: () => void;
  onResendInvite: () => void;
  onResetPassword: () => void;
  canEdit: boolean;
  canDelete: boolean;
  canAssignRole: boolean;
  isResending: boolean;
}) {
  return (
    <div className={`card-hover flex items-center justify-between gap-4 ${!user.isActive && !user.isPending ? 'opacity-50' : ''}`}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 relative"
          style={{ backgroundColor: user.role?.color || '#6B8F71' }}
        >
          {user.name.charAt(0).toUpperCase()}
          {user.isPending && (
            <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center">
              <Clock size={10} className="text-amber-900" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-ui font-semibold text-bark truncate">{user.name}</h4>
            {user.isPending && (
              <span className="badge bg-amber-100 text-amber-700 text-[10px]">
                <Clock size={10} className="mr-1" />
                Pendiente
              </span>
            )}
            {!user.isActive && !user.isPending && (
              <span className="badge bg-oliva-100 text-oliva-600">Inactivo</span>
            )}
          </div>
          <p className="text-sm text-oliva-500 truncate">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="badge text-white text-xs"
          style={{ backgroundColor: user.role?.color || '#6B8F71' }}
        >
          {user.role?.name || 'Sin rol'}
        </span>
        <div className="flex items-center gap-1">
          {/* Resend invitation button */}
          {user.isPending && canEdit && (
            <button
              onClick={onResendInvite}
              disabled={isResending}
              className="p-1.5 rounded-revo-sm hover:bg-amber-50 transition-colors disabled:opacity-50"
              title="Reenviar invitación"
            >
              {isResending ? (
                <RefreshCw size={16} className="text-amber-500 animate-spin" />
              ) : (
                <Mail size={16} className="text-amber-500" />
              )}
            </button>
          )}
          {/* Reset password button (for active users) */}
          {!user.isPending && user.isActive && canEdit && (
            <button
              onClick={onResetPassword}
              className="p-1.5 rounded-revo-sm hover:bg-blue-50 transition-colors"
              title="Enviar reset de contraseña"
            >
              <KeyRound size={16} className="text-blue-500" />
            </button>
          )}
          {/* Edit button */}
          {(canEdit || canAssignRole) && (
            <button
              onClick={onEdit}
              className="p-1.5 rounded-revo-sm hover:bg-sand transition-colors"
              title="Editar"
            >
              <Pencil size={16} className="text-oliva-500" />
            </button>
          )}
          {/* Delete button */}
          {canDelete && (
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
export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [resendingId, setResendingId] = useState<string | null>(null);

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRoleId, setUserRoleId] = useState('');

  const { get, post, put, del } = useApi();
  const { success, error } = useToast();

  // ─── Permissions ───
  const { can } = usePermissions();
  const canCreate = can('users:create');
  const canEdit = can('users:edit');
  const canDelete = can('users:delete');
  const canAssignRole = can('users:assign_role');

  // ─── Fetch Data ───
  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        get<any>('/users'),
        get<any>('/roles'),
      ]);
      setUsers(usersRes?.data || usersRes || []);
      setRoles(rolesRes?.data || rolesRes || []);
    } catch (err: any) {
      error(err.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ─── Filter ───
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(q) ||
      user.email.toLowerCase().includes(q) ||
      user.role?.name.toLowerCase().includes(q)
    );
  });

  // Sort: pending first, then active, then inactive
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (a.isPending && !b.isPending) return -1;
    if (!a.isPending && b.isPending) return 1;
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;
    return a.name.localeCompare(b.name);
  });

  // ─── User CRUD ───
  const openNewUser = () => {
    setEditingUser(null);
    setUserName('');
    setUserEmail('');
    setUserRoleId(roles.find(r => r.name === 'Mesero')?.id || roles[0]?.id || '');
    setShowUserModal(true);
  };

  const openEditUser = (user: User) => {
    setEditingUser(user);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRoleId(user.role?.id || '');
    setShowUserModal(true);
  };

  const saveUser = async () => {
    if (!userName.trim()) {
      error('El nombre es obligatorio');
      return;
    }
    if (!userEmail.trim()) {
      error('El email es obligatorio');
      return;
    }

    try {
      const payload: any = {
        name: userName.trim(),
        email: userEmail.trim(),
        roleId: userRoleId,
      };

      if (editingUser) {
        await put(`/users/${editingUser.id}`, payload);
        success('Usuario actualizado');
      } else {
        await post('/users', payload);
        success('Invitación enviada correctamente');
      }
      setShowUserModal(false);
      fetchData();
    } catch (err: any) {
      error(err.message || 'Error al guardar');
    }
  };

  const deleteUser = async () => {
    if (!showDeleteModal) return;

    try {
      await del(`/users/${showDeleteModal.id}`);
      success('Usuario eliminado');
      setShowDeleteModal(null);
      fetchData();
    } catch (err: any) {
      error(err.message || 'Error al eliminar');
    }
  };

  // ─── Resend Invitation ───
  const resendInvitation = async (userId: string) => {
    setResendingId(userId);
    try {
      await post(`/users/${userId}/resend-invitation`, {});
      success('Invitación reenviada');
      fetchData();
    } catch (err: any) {
      error(err.message || 'Error al reenviar invitación');
    } finally {
      setResendingId(null);
    }
  };

  // ─── Reset Password ───
  const resetPassword = async (userId: string, userName: string) => {
    try {
      await post(`/users/${userId}/reset-password`, {});
      success(`Email de recuperación enviado a ${userName}`);
    } catch (err: any) {
      error(err.message || 'Error al enviar email de recuperación');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-3 border-arcilla-200 border-t-arcilla-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Count pending invitations
  const pendingCount = users.filter(u => u.isPending).length;

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-heading font-bold text-bark">Equipo</h1>
          <p className="text-sm text-oliva-500 font-body mt-1">
            {users.length} {users.length === 1 ? 'miembro' : 'miembros'}
            {pendingCount > 0 && (
              <span className="text-amber-600 ml-2">
                • {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        {canCreate && (
          <button onClick={openNewUser} className="btn btn-primary">
            <Plus size={18} />
            Invitar miembro
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-oliva-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, email o rol..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Users List */}
      {sortedUsers.length === 0 ? (
        <div className="card text-center py-12">
          <Users size={48} className="mx-auto text-oliva-300 mb-3" />
          <h3 className="font-heading font-semibold text-bark">
            {searchQuery ? 'Sin resultados' : 'Sin miembros'}
          </h3>
          <p className="text-sm text-oliva-500 mt-1">
            {searchQuery
              ? 'Intenta con otra búsqueda'
              : 'Invita a tu primer miembro del equipo'}
          </p>
          {!searchQuery && canCreate && (
            <button onClick={openNewUser} className="btn btn-primary mt-4">
              <Plus size={18} />
              Invitar miembro
            </button>
          )}
        </div>
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="divide-y divide-sand">
            {sortedUsers.map((user) => (
              <div key={user.id} className="px-5 py-3">
                <UserCard
                  user={user}
                  onEdit={() => openEditUser(user)}
                  onDelete={() => setShowDeleteModal(user)}
                  onResendInvite={() => resendInvitation(user.id)}
                  onResetPassword={() => resetPassword(user.id, user.name)}
                  canEdit={canEdit}
                  canDelete={canDelete}
                  canAssignRole={canAssignRole}
                  isResending={resendingId === user.id}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── User Modal ── */}
      <Modal
        isOpen={showUserModal}
        onClose={() => setShowUserModal(false)}
        title={editingUser ? 'Editar miembro' : 'Invitar miembro'}
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowUserModal(false)}>
              Cancelar
            </ModalButton>
            <ModalButton onClick={saveUser} disabled={!userName.trim() || !userEmail.trim()}>
              {editingUser ? 'Guardar' : 'Enviar invitación'}
            </ModalButton>
          </>
        }
      >
        {/* Info box for new users */}
        {!editingUser && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-xl">
            <p className="text-sm text-blue-700">
              <Mail size={14} className="inline mr-1.5 -mt-0.5" />
              Se enviará un email de invitación para que el usuario configure su contraseña.
            </p>
          </div>
        )}

        <ModalInput
          label="Nombre"
          value={userName}
          onChange={setUserName}
          placeholder="Nombre completo"
          required
        />
        <ModalInput
          label="Email"
          value={userEmail}
          onChange={setUserEmail}
          placeholder="correo@ejemplo.com"
          required
          disabled={!!editingUser}
        />
        {canAssignRole && (
          <div className="mb-4">
            <label className="label">Rol</label>
            <select
              className="input"
              value={userRoleId}
              onChange={(e) => setUserRoleId(e.target.value)}
            >
              {roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        title="Eliminar miembro"
        size="sm"
        footer={
          <>
            <ModalButton variant="secondary" onClick={() => setShowDeleteModal(null)}>
              Cancelar
            </ModalButton>
            <ModalButton variant="danger" onClick={deleteUser}>
              Sí, eliminar
            </ModalButton>
          </>
        }
      >
        <p className="text-oliva-600">
          ¿Estás seguro de que quieres eliminar a{' '}
          <strong className="text-bark">{showDeleteModal?.name}</strong>?
          <span className="block mt-2 text-sm text-arcilla-500">
            Esta acción no se puede deshacer.
          </span>
        </p>
      </Modal>
    </div>
  );
}
