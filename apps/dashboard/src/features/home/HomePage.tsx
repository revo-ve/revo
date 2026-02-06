// ============================================
// REVO — Home Page (Accessible to all users)
// ============================================
// Location: apps/dashboard/src/features/home/HomePage.tsx
// ============================================

import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  UtensilsCrossed, 
  Grid3X3, 
  ClipboardList,
  Monitor,
  ChefHat,
  BarChart3,
  Package,
  Users,
  Shield,
  QrCode,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';
import { usePermissions } from '../../hooks/usePermissions';

// Quick access item type
interface QuickAccessItem {
  id: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  permission: string;
  color: string;
  bgColor: string;
}

// All possible quick access items
const allQuickAccess: QuickAccessItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    description: 'Estadísticas y resumen del día',
    icon: <LayoutDashboard size={28} />,
    path: '/dashboard',
    permission: 'dashboard:view',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    id: 'orders',
    label: 'Pedidos',
    description: 'Ver y gestionar pedidos',
    icon: <ClipboardList size={28} />,
    path: '/orders',
    permission: 'orders:view',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
  },
  {
    id: 'pos',
    label: 'Punto de Venta',
    description: 'Crear pedidos rápidamente',
    icon: <Monitor size={28} />,
    path: '/pos',
    permission: 'pos:access',
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
  },
  {
    id: 'tables',
    label: 'Mesas',
    description: 'Estado de mesas y zonas',
    icon: <Grid3X3 size={28} />,
    path: '/tables',
    permission: 'tables:view',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
  },
  {
    id: 'kds',
    label: 'Cocina (KDS)',
    description: 'Pantalla de cocina',
    icon: <ChefHat size={28} />,
    path: '/kds',
    permission: 'kds:access',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
  },
  {
    id: 'menu',
    label: 'Menú',
    description: 'Productos y categorías',
    icon: <UtensilsCrossed size={28} />,
    path: '/catalog',
    permission: 'menu:view',
    color: 'text-rose-600',
    bgColor: 'bg-rose-50 hover:bg-rose-100',
  },
  {
    id: 'inventory',
    label: 'Inventario',
    description: 'Control de stock',
    icon: <Package size={28} />,
    path: '/inventory',
    permission: 'inventory:view',
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100',
  },
  {
    id: 'reports',
    label: 'Reportes',
    description: 'Análisis y estadísticas',
    icon: <BarChart3 size={28} />,
    path: '/reports',
    permission: 'reports:view',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
  },
  {
    id: 'users',
    label: 'Equipo',
    description: 'Gestionar empleados',
    icon: <Users size={28} />,
    path: '/users',
    permission: 'users:view',
    color: 'text-sky-600',
    bgColor: 'bg-sky-50 hover:bg-sky-100',
  },
  {
    id: 'roles',
    label: 'Roles',
    description: 'Permisos y accesos',
    icon: <Shield size={28} />,
    path: '/roles',
    permission: 'roles:view',
    color: 'text-slate-600',
    bgColor: 'bg-slate-50 hover:bg-slate-100',
  },
  {
    id: 'qr',
    label: 'Códigos QR',
    description: 'Menú digital y QRs',
    icon: <QrCode size={28} />,
    path: '/qr',
    permission: 'qr:view',
    color: 'text-fuchsia-600',
    bgColor: 'bg-fuchsia-50 hover:bg-fuchsia-100',
  },
];

// Get greeting based on time of day
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

// Get first name from full name
function getFirstName(fullName: string): string {
  return fullName.split(' ')[0];
}

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { can } = usePermissions();

  // Filter quick access items based on permissions
  const availableAccess = allQuickAccess.filter(item => can(item.permission));

  const greeting = getGreeting();
  const firstName = user?.name ? getFirstName(user.name) : 'Usuario';
  const roleName = user?.role?.name || 'Sin rol';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header / Greeting */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-arcilla-400 to-arcilla-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {firstName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-bark">
              {greeting}, {firstName}! 👋
            </h1>
            <p className="text-oliva-500 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-sand rounded-full text-xs font-medium text-bark">
                <Sparkles size={12} />
                {roleName}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Quick Access Grid */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-bark mb-4">
          Accesos rápidos
        </h2>
        
        {availableAccess.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableAccess.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={`
                  ${item.bgColor}
                  p-5 rounded-xl text-left transition-all duration-200
                  hover:shadow-md hover:scale-[1.02] active:scale-[0.98]
                  border border-transparent hover:border-gray-200
                  group
                `}
              >
                <div className="flex items-start justify-between">
                  <div className={`${item.color} mb-3`}>
                    {item.icon}
                  </div>
                  <ArrowRight 
                    size={18} 
                    className="text-gray-300 group-hover:text-gray-400 group-hover:translate-x-1 transition-all" 
                  />
                </div>
                <h3 className="font-semibold text-bark mb-1">
                  {item.label}
                </h3>
                <p className="text-sm text-oliva-500">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-sand/50 rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-oliva-100 flex items-center justify-center">
              <Shield size={32} className="text-oliva-400" />
            </div>
            <h3 className="font-semibold text-bark mb-2">
              Sin accesos disponibles
            </h3>
            <p className="text-sm text-oliva-500">
              Contacta al administrador para que te asigne permisos.
            </p>
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-arcilla-50 to-cream rounded-xl p-5 border border-arcilla-100">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm">
            <Sparkles size={20} className="text-arcilla-500" />
          </div>
          <div>
            <h3 className="font-semibold text-bark mb-1">
              Tip del día
            </h3>
            <p className="text-sm text-oliva-600">
              {availableAccess.length > 0 
                ? `Tienes acceso a ${availableAccess.length} ${availableAccess.length === 1 ? 'sección' : 'secciones'} del sistema. Usa los accesos rápidos para navegar más fácilmente.`
                : 'Tu cuenta está activa pero aún no tienes permisos asignados. El administrador puede configurar tus accesos desde la sección de Roles.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
