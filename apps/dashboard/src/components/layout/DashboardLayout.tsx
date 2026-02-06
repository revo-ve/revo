// ============================================
// REVO — Dashboard Layout (with Super Admin Button)
// ============================================
// Location: apps/dashboard/src/components/layout/DashboardLayout.tsx
// ============================================

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Home,
  LayoutDashboard,
  UtensilsCrossed,
  Grid3X3,
  ClipboardList,
  Monitor,
  ChefHat,
  BarChart3,
  Users,
  QrCode,
  Package,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { usePermissions } from '../../hooks/usePermissions';
import { useAuthStore } from '../../stores/auth.store';

// ─── Types ───
interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  permission?: string;
  dividerAfter?: boolean;
}

interface RoleInfo {
  id: string;
  name: string;
  color: string;
  permissions: { code: string }[];
}

interface UserInfo {
  name: string;
  email: string;
  role: RoleInfo;
  tenantName?: string;
  isSuperAdmin?: boolean;
}

// ─── Navigation Config ───
const navigation: NavItem[] = [
  { name: 'Inicio', href: '/', icon: Home },
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, permission: 'dashboard:view', dividerAfter: true },
  { name: 'Menú', href: '/catalog', icon: UtensilsCrossed, permission: 'menu:view' },
  { name: 'Mesas', href: '/tables', icon: Grid3X3, permission: 'tables:view' },
  { name: 'Pedidos', href: '/orders', icon: ClipboardList, permission: 'orders:view' },
  { name: 'POS', href: '/pos', icon: Monitor, permission: 'pos:access' },
  { name: 'Cocina (KDS)', href: '/kds', icon: ChefHat, permission: 'kds:access', dividerAfter: true },
  { name: 'Reportes', href: '/reports', icon: BarChart3, permission: 'reports:view' },
  { name: 'Inventario', href: '/inventory', icon: Package, permission: 'inventory:view' },
  { name: 'Equipo', href: '/users', icon: Users, permission: 'users:view' },
  { name: 'Roles', href: '/roles', icon: Shield, permission: 'roles:view' },
  { name: 'Carta Digital', href: '/qr', icon: QrCode, permission: 'qr:view' },
];

// ─── Component ───
export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [alerts, setAlerts] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { get } = useApi();
  const { can } = usePermissions();
  const setAuthUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    const token = localStorage.getItem('revo_access_token');
    if (!token) return;

    const fetchData = async () => {
      try {
        const profile = await get<{
          name: string;
          email: string;
          role: RoleInfo;
          tenant?: { name: string };
          isSuperAdmin?: boolean;
        }>('/auth/me');

        const userInfo: UserInfo = {
          name: profile.name || 'Usuario',
          email: profile.email || '',
          role: profile.role,
          tenantName: profile.tenant?.name,
          isSuperAdmin: profile.isSuperAdmin || false,
        };

        setUser(userInfo);

        setAuthUser({
          id: '',
          tenantId: '',
          email: profile.email,
          name: profile.name,
          role: profile.role,
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchData();
  }, [get, setAuthUser]);

  // Fetch inventory alerts ONLY if user has permission
  useEffect(() => {
    if (!user?.role?.permissions) return;

    const hasInventoryPermission = user.role.permissions.some(
        (p: any) => p.code === 'inventory:view' || p.permission?.code === 'inventory:view'
    );

    if (!hasInventoryPermission) return;

    const fetchAlerts = async () => {
      try {
        const data = await get<any[]>('/inventory/alerts');
        const alertsData = Array.isArray(data) ? data : (data as any)?.data || [];
        setAlerts(alertsData.length);
      } catch {
        /* ignore */
      }
    };

    fetchAlerts();
  }, [user, get]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('revo_access_token');
    localStorage.removeItem('revo_refresh_token');
    setAuthUser(null);
    window.location.href = '/login';
  };

  const filteredNav = navigation.filter((item) => {
    if (!item.permission) return true;
    return can(item.permission);
  });

  const navWithBadges = filteredNav.map((item) => ({
    ...item,
    badge: item.href === '/inventory' && alerts > 0 ? alerts : undefined,
  }));

  return (
      <div className="flex min-h-screen bg-cream">
        {/* Overlay */}
        {sidebarOpen && (
            <div
                className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
            />
        )}

        {/* Sidebar */}
        <aside
            className={`fixed inset-y-0 left-0 w-[260px] bg-bark text-white flex flex-col z-50 transform transition-transform duration-250 ease-out lg:translate-x-0 ${
                sidebarOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
            <div className="w-10 h-10 rounded-revo bg-arcilla-500 flex items-center justify-center">
              <span className="text-white text-xl font-heading font-black">R</span>
            </div>
            <div className="flex-1">
              <div className="text-xl font-heading font-black tracking-tight">
                <span className="text-arcilla-400">RE</span>
                <span className="text-white">VO</span>
              </div>
              <div className="text-[10px] text-white/50 tracking-[0.15em] uppercase">
                {user?.tenantName || 'Tu negocio, evolucionado'}
              </div>
            </div>
            <button
                className="lg:hidden w-8 h-8 flex items-center justify-center bg-white/10 rounded-revo-sm hover:bg-white/20 transition-colors"
                onClick={() => setSidebarOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-3 overflow-y-auto scrollbar-hide space-y-1">
            {navWithBadges.map((item, index) => {
              const Icon = item.icon;
              const isActive = item.href === '/'
                  ? location.pathname === '/'
                  : location.pathname === item.href || location.pathname.startsWith(item.href + '/');

              return (
                  <div key={item.href}>
                    <NavLink
                        to={item.href}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-revo text-sm font-medium transition-all ${
                            isActive
                                ? 'bg-white/15 text-white font-semibold'
                                : 'text-white/75 hover:bg-white/10 hover:text-white'
                        }`}
                    >
                      <Icon size={20} />
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                          <span className="bg-arcilla-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                      )}
                    </NavLink>
                    {item.dividerAfter && index < navWithBadges.length - 1 && (
                        <div className="my-2 mx-3 border-t border-white/10" />
                    )}
                  </div>
              );
            })}
          </nav>

          {/* Super Admin Button - En sidebar */}
          {user?.isSuperAdmin && (
              <div className="px-3 pb-2">
                <button
                    onClick={() => navigate('/superadmin')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-revo text-sm font-medium bg-amber-500 hover:bg-amber-400 text-amber-950 transition-all"
                >
                  <Shield size={20} />
                  <span>Panel Super Admin</span>
                </button>
              </div>
          )}

          {/* User section */}
          <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/10">
            <div className="flex items-center gap-2.5">
              <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: user?.role?.color || '#6B8F71' }}
              >
                {user?.name.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div className="text-sm font-semibold">{user?.name || 'Usuario'}</div>
                <div
                    className="text-[11px] px-1.5 py-0.5 rounded inline-block"
                    style={{
                      backgroundColor: user?.role?.color ? `${user.role.color}40` : 'rgba(255,255,255,0.2)',
                      color: 'white',
                    }}
                >
                  {user?.role?.name || 'Sin rol'}
                </div>
              </div>
            </div>
            <button
                onClick={handleLogout}
                className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-revo-sm hover:bg-white/20 transition-colors"
                title="Cerrar sesión"
            >
              <LogOut size={18} />
            </button>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-h-screen lg:ml-[260px]">
          {/* Topbar */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 bg-white border-b border-sand">
            <button
                className="lg:hidden w-10 h-10 flex items-center justify-center bg-sand rounded-revo text-bark hover:bg-oliva-100 transition-colors"
                onClick={() => setSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            <div className="flex items-center gap-3 ml-auto">
              {/* Notifications */}
              {can('inventory:view') && (
                  <button
                      className="relative w-10 h-10 flex items-center justify-center bg-sand rounded-revo text-bark hover:bg-oliva-100 transition-colors"
                      onClick={() => navigate('/inventory')}
                  >
                    <Bell size={20} />
                    {alerts > 0 && (
                        <span className="absolute top-1 right-1 w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {alerts}
                  </span>
                    )}
                  </button>
              )}

              {/* User dropdown */}
              <div className="relative">
                <button
                    className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 border border-sand rounded-revo bg-white hover:bg-cream transition-colors"
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                >
                  <div
                      className="w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: user?.role?.color || '#3D4F2F' }}
                  >
                    {user?.name.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="text-sm font-semibold text-bark max-w-[100px] truncate hidden sm:block">
                  {user?.name}
                </span>
                  <ChevronDown size={16} className="text-oliva-500" />
                </button>

                {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-revo-lg shadow-xl overflow-hidden z-50">
                        <div className="p-4 bg-cream">
                          <div className="font-heading font-bold text-bark">{user?.name}</div>
                          <div className="text-xs text-oliva-500 mt-0.5">{user?.email}</div>
                          <div
                              className="text-xs font-semibold mt-1.5 px-2 py-0.5 rounded inline-block text-white"
                              style={{ backgroundColor: user?.role?.color || '#6B8F71' }}
                          >
                            {user?.role?.name || 'Sin rol'}
                          </div>
                        </div>
                        <div className="border-t border-sand" />

                        {/* Super Admin Button - En dropdown */}
                        {user?.isSuperAdmin && (
                            <>
                              <button
                                  onClick={() => {
                                    setUserMenuOpen(false);
                                    navigate('/superadmin');
                                  }}
                                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 transition-colors"
                              >
                                <Shield size={16} />
                                Panel Super Admin
                              </button>
                              <div className="border-t border-sand" />
                            </>
                        )}

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-oliva-600 hover:bg-cream transition-colors"
                        >
                          <LogOut size={16} />
                          Cerrar sesión
                        </button>
                      </div>
                    </>
                )}
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
  );
}