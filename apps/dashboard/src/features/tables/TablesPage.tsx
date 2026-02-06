// ============================================
// REVO — Tables Page (with Permissions)
// ============================================
// Location: apps/dashboard/src/features/tables/TablesPage.tsx
// ============================================

import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Users,
  MapPin,
  CircleDot,
  ChefHat,
  Clock,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermissions';
import Modal, { ModalInput, ModalButton } from '../../components/ui/Modal';

// ─── Types ───
interface Zone {
  id: string;
  name: string;
  sortOrder: number;
  tables: TableItem[];
}

interface TableItem {
  id: string;
  zoneId: string | null;
  number: string;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' | 'CLEANING';
  qrCode: string | null;
}

// ─── Status Config ───
const STATUS_CONFIG = {
  AVAILABLE: {
    label: 'Libre',
    bg: 'bg-salvia-50 border-salvia-200 hover:border-salvia-400',
    dot: 'bg-salvia-500',
    text: 'text-salvia-700',
    icon: Sparkles,
  },
  OCCUPIED: {
    label: 'Ocupada',
    bg: 'bg-arcilla-50 border-arcilla-200 hover:border-arcilla-400',
    dot: 'bg-arcilla-500',
    text: 'text-arcilla-700',
    icon: ChefHat,
  },
  RESERVED: {
    label: 'Reservada',
    bg: 'bg-miel-50 border-miel-200 hover:border-miel-400',
    dot: 'bg-miel-500',
    text: 'text-miel-700',
    icon: Clock,
  },
  CLEANING: {
    label: 'Limpieza',
    bg: 'bg-oliva-50 border-oliva-200 hover:border-oliva-400',
    dot: 'bg-oliva-400',
    text: 'text-oliva-600',
    icon: CircleDot,
  },
};

// ─── Table Card ───
function TableCard({
                     table,
                     onStatusChange,
                     onEdit,
                     onDelete,
                     onViewQR,
                     canManage,
                   }: {
  table: TableItem;
  onStatusChange: (status: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onViewQR: () => void;
  canManage: boolean;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const config = STATUS_CONFIG[table.status];
  const Icon = config.icon;

  return (
      <div className="relative">
        <div
            className={`border-2 rounded-revo p-4 cursor-pointer transition-all duration-200 ${config.bg}`}
            onClick={() => setShowMenu(!showMenu)}
        >
          {/* Table number */}
          <div className="flex items-center justify-between mb-3">
          <span className="font-heading font-bold text-xl text-bark">
            {table.number}
          </span>
            <div className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          </div>

          {/* Status + capacity */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Icon size={14} className={config.text} />
              <span className={`text-xs font-ui font-semibold ${config.text}`}>
              {config.label}
            </span>
            </div>
            <div className="flex items-center gap-1 text-oliva-400">
              <Users size={12} />
              <span className="text-xs font-ui">{table.capacity}</span>
            </div>
          </div>
        </div>

        {/* Quick action menu */}
        {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-white rounded-revo shadow-revo-lg border border-sand p-2 space-y-1">
                {canManage && Object.entries(STATUS_CONFIG).map(([key, val]) => (
                    <button
                        key={key}
                        onClick={() => {
                          onStatusChange(key);
                          setShowMenu(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-revo-sm text-xs font-ui flex items-center gap-2 transition-colors ${
                            table.status === key
                                ? 'bg-sand font-semibold'
                                : 'hover:bg-sand/50'
                        }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${val.dot}`} />
                      {val.label}
                    </button>
                ))}
                {canManage && <div className="border-t border-sand my-1" />}
                {table.qrCode && (
                    <button
                        onClick={() => { onViewQR(); setShowMenu(false); }}
                        className="w-full text-left px-3 py-1.5 rounded-revo-sm text-xs font-ui flex items-center gap-2 hover:bg-sand/50"
                    >
                      <QrCode size={12} /> Ver QR
                    </button>
                )}
                {canManage && (
                    <button
                        onClick={() => { onEdit(); setShowMenu(false); }}
                        className="w-full text-left px-3 py-1.5 rounded-revo-sm text-xs font-ui flex items-center gap-2 hover:bg-sand/50"
                    >
                      <Pencil size={12} /> Editar
                    </button>
                )}
                {canManage && (
                    <button
                        onClick={() => { onDelete(); setShowMenu(false); }}
                        className="w-full text-left px-3 py-1.5 rounded-revo-sm text-xs font-ui flex items-center gap-2 hover:bg-arcilla-50 text-arcilla-500"
                    >
                      <Trash2 size={12} /> Eliminar
                    </button>
                )}
              </div>
            </>
        )}
      </div>
  );
}

// ─── Main Page ───
export default function TablesPage() {
  const [zones, setZones] = useState<Zone[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showZoneModal, setShowZoneModal] = useState(false);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{
    type: 'zone' | 'table';
    id: string;
    name: string;
  } | null>(null);
  const [editingZone, setEditingZone] = useState<Zone | null>(null);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);

  // Forms
  const [zoneName, setZoneName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [tableCapacity, setTableCapacity] = useState('4');
  const [tableZoneId, setTableZoneId] = useState('');

  const { get, post, put, patch, del } = useApi();
  const { success, error } = useToast();
  const navigate = useNavigate();

  // ─── Permissions ───
  const { can } = usePermissions();
  const canManage = can('tables:manage');
  const canViewQR = can('qr:view');

  // ─── Fetch Zones ───
  const fetchZones = async () => {
    try {
      const res = await get<Zone[]>('/tables/zones');
      const data = Array.isArray(res) ? res : (res as any)?.data || [];
      setZones(data);
    } catch (err: any) {
      error(err.message || 'Error al cargar las zonas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  // Stats
  const allTables = zones.flatMap((z) => z.tables || []);
  const stats = {
    total: allTables.length,
    available: allTables.filter((t) => t.status === 'AVAILABLE').length,
    occupied: allTables.filter((t) => t.status === 'OCCUPIED').length,
    reserved: allTables.filter((t) => t.status === 'RESERVED').length,
  };

  // ─── Zone CRUD ───
  const openNewZone = () => {
    setEditingZone(null);
    setZoneName('');
    setShowZoneModal(true);
  };

  const openEditZone = (zone: Zone) => {
    setEditingZone(zone);
    setZoneName(zone.name);
    setShowZoneModal(true);
  };

  const saveZone = async () => {
    if (!zoneName.trim()) {
      error('El nombre es obligatorio');
      return;
    }

    try {
      if (editingZone) {
        await put(`/tables/zones/${editingZone.id}`, { name: zoneName.trim() });
        success('Zona actualizada');
      } else {
        await post('/tables/zones', { name: zoneName.trim() });
        success('Zona creada');
      }
      setShowZoneModal(false);
      fetchZones();
    } catch (err: any) {
      error(err.message || 'Error al guardar');
    }
  };

  const deleteZone = async () => {
    if (!showDeleteModal || showDeleteModal.type !== 'zone') return;

    try {
      await del(`/tables/zones/${showDeleteModal.id}`);
      success('Zona eliminada');
      setShowDeleteModal(null);
      fetchZones();
    } catch (err: any) {
      error(err.message || 'No se puede eliminar la zona');
    }
  };

  // ─── Table CRUD ───
  const openNewTable = (zoneId: string) => {
    setEditingTable(null);
    setTableNumber('');
    setTableCapacity('4');
    setTableZoneId(zoneId);
    setShowTableModal(true);
  };

  const openEditTable = (table: TableItem) => {
    setEditingTable(table);
    setTableNumber(table.number);
    setTableCapacity(table.capacity.toString());
    setTableZoneId(table.zoneId || '');
    setShowTableModal(true);
  };

  const saveTable = async () => {
    if (!tableNumber.trim()) {
      error('El número de mesa es obligatorio');
      return;
    }

    try {
      const payload = {
        number: tableNumber.trim(),
        capacity: parseInt(tableCapacity) || 4,
        zoneId: tableZoneId || undefined,
      };

      if (editingTable) {
        await put(`/tables/${editingTable.id}`, payload);
        success('Mesa actualizada');
      } else {
        await post('/tables', payload);
        success('Mesa creada');
      }
      setShowTableModal(false);
      fetchZones();
    } catch (err: any) {
      error(err.message || 'Error al guardar');
    }
  };

  const changeTableStatus = async (tableId: string, status: string) => {
    try {
      await patch(`/tables/${tableId}/status`, { status });
      success(`Mesa ${STATUS_CONFIG[status as keyof typeof STATUS_CONFIG]?.label || status}`);
      fetchZones();
    } catch (err: any) {
      error(err.message || 'Error al cambiar estado');
    }
  };

  const deleteTable = async () => {
    if (!showDeleteModal || showDeleteModal.type !== 'table') return;

    try {
      await del(`/tables/${showDeleteModal.id}`);
      success('Mesa eliminada');
      setShowDeleteModal(null);
      fetchZones();
    } catch (err: any) {
      error(err.message || 'No se puede eliminar la mesa');
    }
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-3 border-arcilla-200 border-t-arcilla-500 rounded-full animate-spin" />
        </div>
    );
  }

  return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-bark">Mesas</h1>
            <p className="text-sm text-oliva-500 font-body mt-1">
              Gestión de zonas y mesas del restaurante
            </p>
          </div>
          <div className="flex gap-2">
            {canViewQR && (
                <button onClick={() => navigate('/qr')} className="btn btn-outline">
                  <QrCode size={18} />
                  Códigos QR
                </button>
            )}
            {canManage && (
                <button onClick={openNewZone} className="btn btn-primary">
                  <Plus size={18} />
                  Nueva zona
                </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-revo-sm bg-oliva-100 flex items-center justify-center">
              <MapPin size={18} className="text-oliva-600" />
            </div>
            <div>
              <p className="text-xs font-ui text-oliva-500">Total</p>
              <p className="text-xl font-heading font-bold text-bark">{stats.total}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-revo-sm bg-salvia-100 flex items-center justify-center">
              <Sparkles size={18} className="text-salvia-600" />
            </div>
            <div>
              <p className="text-xs font-ui text-oliva-500">Libres</p>
              <p className="text-xl font-heading font-bold text-salvia-600">{stats.available}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-revo-sm bg-arcilla-100 flex items-center justify-center">
              <ChefHat size={18} className="text-arcilla-600" />
            </div>
            <div>
              <p className="text-xs font-ui text-oliva-500">Ocupadas</p>
              <p className="text-xl font-heading font-bold text-arcilla-600">{stats.occupied}</p>
            </div>
          </div>
          <div className="card flex items-center gap-3">
            <div className="w-10 h-10 rounded-revo-sm bg-miel-100 flex items-center justify-center">
              <Clock size={18} className="text-miel-600" />
            </div>
            <div>
              <p className="text-xs font-ui text-oliva-500">Reservadas</p>
              <p className="text-xl font-heading font-bold text-miel-600">{stats.reserved}</p>
            </div>
          </div>
        </div>

        {/* Zones */}
        {zones.length === 0 ? (
            <div className="card text-center py-12">
              <MapPin size={48} className="mx-auto text-oliva-300 mb-3" />
              <h3 className="font-heading font-semibold text-bark">Sin zonas</h3>
              <p className="text-sm text-oliva-500 mt-1">
                Comienza creando zonas como "Salón", "Terraza", "Barra"
              </p>
              {canManage && (
                  <button onClick={openNewZone} className="btn btn-primary mt-4">
                    <Plus size={18} />
                    Crear primera zona
                  </button>
              )}
            </div>
        ) : (
            <div className="space-y-6">
              {zones.map((zone) => (
                  <div key={zone.id}>
                    {/* Zone header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h2 className="font-heading font-bold text-lg text-bark">{zone.name}</h2>
                        <span className="badge bg-oliva-100 text-oliva-600">
                    {zone.tables?.length || 0} mesas
                  </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {canManage && (
                            <button
                                onClick={() => openNewTable(zone.id)}
                                className="btn btn-ghost text-xs !px-3 !py-1.5"
                            >
                              <Plus size={14} />
                              Mesa
                            </button>
                        )}
                        {canManage && (
                            <button
                                onClick={() => openEditZone(zone)}
                                className="p-1.5 rounded-revo-sm hover:bg-sand transition-colors"
                            >
                              <Pencil size={14} className="text-oliva-500" />
                            </button>
                        )}
                        {canManage && (
                            <button
                                onClick={() => setShowDeleteModal({ type: 'zone', id: zone.id, name: zone.name })}
                                className="p-1.5 rounded-revo-sm hover:bg-arcilla-50 transition-colors"
                            >
                              <Trash2 size={14} className="text-arcilla-400" />
                            </button>
                        )}
                      </div>
                    </div>

                    {/* Tables grid */}
                    {!zone.tables || zone.tables.length === 0 ? (
                        canManage ? (
                            <button
                                onClick={() => openNewTable(zone.id)}
                                className="w-full py-8 border-2 border-dashed border-oliva-200 rounded-revo text-sm text-oliva-400 hover:border-arcilla-300 hover:text-arcilla-500 transition-colors"
                            >
                              + Agregar mesa a {zone.name}
                            </button>
                        ) : (
                            <p className="text-sm text-oliva-400 text-center py-8">
                              Sin mesas en esta zona
                            </p>
                        )
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                          {zone.tables.map((table) => (
                              <TableCard
                                  key={table.id}
                                  table={table}
                                  onStatusChange={(status) => changeTableStatus(table.id, status)}
                                  onEdit={() => openEditTable(table)}
                                  onDelete={() => setShowDeleteModal({ type: 'table', id: table.id, name: `Mesa ${table.number}` })}
                                  onViewQR={() => navigate(`/qr?table=${table.id}`)}
                                  canManage={canManage}
                              />
                          ))}
                        </div>
                    )}
                  </div>
              ))}
            </div>
        )}

        {/* ── Zone Modal ── */}
        <Modal
            isOpen={showZoneModal}
            onClose={() => setShowZoneModal(false)}
            title={editingZone ? 'Editar zona' : 'Nueva zona'}
            footer={
              <>
                <ModalButton variant="secondary" onClick={() => setShowZoneModal(false)}>
                  Cancelar
                </ModalButton>
                <ModalButton onClick={saveZone} disabled={!zoneName.trim()}>
                  {editingZone ? 'Guardar' : 'Crear'}
                </ModalButton>
              </>
            }
        >
          <ModalInput
              label="Nombre de la zona"
              value={zoneName}
              onChange={setZoneName}
              placeholder="Ej: Salón Principal, Terraza, Barra..."
              required
          />
        </Modal>

        {/* ── Table Modal ── */}
        <Modal
            isOpen={showTableModal}
            onClose={() => setShowTableModal(false)}
            title={editingTable ? 'Editar mesa' : 'Nueva mesa'}
            footer={
              <>
                <ModalButton variant="secondary" onClick={() => setShowTableModal(false)}>
                  Cancelar
                </ModalButton>
                <ModalButton onClick={saveTable} disabled={!tableNumber.trim()}>
                  {editingTable ? 'Guardar' : 'Crear'}
                </ModalButton>
              </>
            }
        >
          <ModalInput
              label="Número de mesa"
              value={tableNumber}
              onChange={setTableNumber}
              placeholder="Ej: 1, T1, B3..."
              required
          />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="label">Capacidad</label>
              <input
                  className="input"
                  type="number"
                  min="1"
                  max="50"
                  value={tableCapacity}
                  onChange={(e) => setTableCapacity(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Zona</label>
              <select
                  className="input"
                  value={tableZoneId}
                  onChange={(e) => setTableZoneId(e.target.value)}
              >
                <option value="">Sin zona</option>
                {zones.map((z) => (
                    <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
          </div>
        </Modal>

        {/* ── Delete Confirmation Modal ── */}
        <Modal
            isOpen={!!showDeleteModal}
            onClose={() => setShowDeleteModal(null)}
            title={`Eliminar ${showDeleteModal?.type === 'zone' ? 'zona' : 'mesa'}`}
            size="sm"
            footer={
              <>
                <ModalButton variant="secondary" onClick={() => setShowDeleteModal(null)}>
                  Cancelar
                </ModalButton>
                <ModalButton
                    variant="danger"
                    onClick={showDeleteModal?.type === 'zone' ? deleteZone : deleteTable}
                >
                  Sí, eliminar
                </ModalButton>
              </>
            }
        >
          <p className="text-oliva-600">
            ¿Estás seguro de que quieres eliminar{' '}
            <strong className="text-bark">{showDeleteModal?.name}</strong>?
            {showDeleteModal?.type === 'zone' && (
                <span className="block mt-2 text-sm text-arcilla-500">
              Esto también eliminará todas las mesas de esta zona.
            </span>
            )}
          </p>
        </Modal>
      </div>
  );
}