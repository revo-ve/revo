// ============================================
// REVO — Super Admin Layout
// ============================================
// Location: apps/dashboard/src/components/layout/SuperAdminLayout.tsx
// ============================================

import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';

// ─── Types ───
interface UserInfo {
  name: string;
  email: string;
}

// ─── Navigation Config ───
const navigation = [
  { name: 'Dashboard', href: '/superadmin', icon: LayoutDashboard },
  { name: 'Restaurantes', href: '/superadmin/tenants', icon: Building2 },
];

// ─── Component ───
export function SuperAdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { get } = useApi();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await get<any>('/auth/me');
        setUser({
          name: profile.name || 'Super Admin',
          email: profile.email || '',
        });
      } catch (error) {
        console.error('Error fetching profile:', error);
      }
    };

    fetchProfile();
  }, []);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('revo_access_token');
    localStorage.removeItem('revo_refresh_token');
    window.location.href = '/login';
  };

  const goToNormalDashboard = () => {
    navigate('/');
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 w-[260px] bg-slate-900 text-white flex flex-col z-50 transform transition-transform duration-250 ease-out lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center">
            <Shield size={22} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="text-lg font-bold tracking-tight">
              REVO <span className="text-violet-400">Admin</span>
            </div>
            <div className="text-[10px] text-white/50 tracking-wider uppercase">
              Panel de Control
            </div>
          </div>
          <button
            className="lg:hidden w-8 h-8 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/superadmin'
                ? location.pathname === '/superadmin'
                : location.pathname.startsWith(item.href);

            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-violet-600 text-white'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Back to normal dashboard */}
        <div className="p-3 border-t border-white/10">
          <button
            onClick={goToNormalDashboard}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all"
          >
            <ArrowLeft size={20} />
            <span>Volver al Dashboard</span>
          </button>
        </div>

        {/* User section */}
        <div className="flex items-center justify-between p-4 border-t border-white/10 bg-black/20">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-violet-600 flex items-center justify-center text-sm font-bold text-white">
              {user?.name.charAt(0).toUpperCase() || 'S'}
            </div>
            <div>
              <div className="text-sm font-semibold">{user?.name || 'Super Admin'}</div>
              <div className="text-[11px] px-1.5 py-0.5 rounded bg-violet-600/30 text-violet-300 inline-block">
                Super Admin
              </div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-9 h-9 flex items-center justify-center bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen lg:ml-[260px]">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200 shadow-sm">
          <button
            className="lg:hidden w-10 h-10 flex items-center justify-center bg-slate-100 rounded-lg text-slate-700 hover:bg-slate-200 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>

          <div className="hidden lg:block">
            <span className="text-sm text-slate-500">
              Panel de Administración Global
            </span>
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* User dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 transition-colors"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
              >
                <div className="w-7 h-7 rounded-full bg-violet-600 text-white flex items-center justify-center text-xs font-bold">
                  {user?.name.charAt(0).toUpperCase() || 'S'}
                </div>
                <span className="text-sm font-semibold text-slate-700 max-w-[100px] truncate hidden sm:block">
                  {user?.name}
                </span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-xl overflow-hidden z-50 border border-slate-200">
                    <div className="p-4 bg-slate-50">
                      <div className="font-semibold text-slate-900">
                        {user?.name}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {user?.email}
                      </div>
                      <div className="text-xs font-semibold mt-1.5 px-2 py-0.5 rounded bg-violet-600 text-white inline-block">
                        Super Admin
                      </div>
                    </div>
                    <div className="border-t border-slate-200" />
                    <button
                      onClick={goToNormalDashboard}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                      <ArrowLeft size={16} />
                      Volver al Dashboard
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
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
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
