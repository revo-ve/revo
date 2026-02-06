// ============================================
// REVO — App Router (Complete with Auth flows)
// ============================================
// Location: apps/dashboard/src/App.tsx
// ============================================

import { Routes, Route, Navigate } from 'react-router-dom';

// Auth
import ProtectedRoute from './components/auth/ProtectedRoute';
import RequirePermission from './components/auth/RequirePermission';
import LoginPage from './features/auth/LoginPage';
import ForgotPasswordPage from './features/auth/ForgotPasswordPage';
import ResetPasswordPage from './features/auth/ResetPasswordPage';
import SetupPasswordPage from './features/auth/SetupPasswordPage';
import AccessDeniedPage from './features/auth/AccessDeniedPage';

// Layout
import { DashboardLayout } from './components/layout/DashboardLayout';

// Pages
import HomePage from './features/home/HomePage';
import DashboardPage from './features/dashboard/DashboardPage';
import MenuPage from './features/menu/MenuPage';
import TablesPage from './features/tables/TablesPage';
import OrdersPage from './features/orders/OrdersPage';
import PosPage from './features/pos/PosPage';
import KdsPage from './features/kds/KdsPage';
import ReportsPage from './features/reports/ReportsPage';
import InventoryPage from './features/inventory/InventoryPage';
import UsersPage from './features/users/UsersPage';
import RolesPage from './features/roles/RolesPage';
import QrPage from './features/qr/QrPage';
import MenuDigitalPage from './features/menu-digital/MenuDigitalPage';

// Toast Provider
import { ToastProvider } from './components/ui/Toast';

// Superadmin
import { SuperAdminLayout } from './components/layout/SuperAdminLayout';
import SuperAdminDashboard from './features/superadmin/SuperAdminDashboard';
import TenantsListPage from './features/superadmin/TenantsListPage';
import CreateTenantPage from './features/superadmin/CreateTenantPage';
import TenantDetailPage from './features/superadmin/TenantDetailPage';

export function App() {
  return (
    <ToastProvider>
      <Routes>
        {/* ─── Public Auth Routes ─── */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/setup-password" element={<SetupPasswordPage />} />
        <Route path="/access-denied" element={<AccessDeniedPage />} />
        
        {/* ─── Public Menu ─── */}
        <Route path="/menu/:slug" element={<MenuDigitalPage />} />

        {/* ─── Protected Routes (require auth) ─── */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            
            {/* Home - accessible to ALL authenticated users */}
            <Route index element={<HomePage />} />

            {/* Dashboard (stats) - requires dashboard:view */}
            <Route element={<RequirePermission permission="dashboard:view" />}>
              <Route path="dashboard" element={<DashboardPage />} />
            </Route>

            {/* Menu/Catalog - requires menu:view */}
            <Route element={<RequirePermission permission="menu:view" />}>
              <Route path="catalog" element={<MenuPage />} />
            </Route>

            {/* Tables - requires tables:view */}
            <Route element={<RequirePermission permission="tables:view" />}>
              <Route path="tables" element={<TablesPage />} />
            </Route>

            {/* Orders - requires orders:view */}
            <Route element={<RequirePermission permission="orders:view" />}>
              <Route path="orders" element={<OrdersPage />} />
            </Route>

            {/* POS - requires pos:access */}
            <Route element={<RequirePermission permission="pos:access" />}>
              <Route path="pos" element={<PosPage />} />
            </Route>

            {/* KDS (Kitchen) - requires kds:access */}
            <Route element={<RequirePermission permission="kds:access" />}>
              <Route path="kds" element={<KdsPage />} />
            </Route>

            {/* Reports - requires reports:view */}
            <Route element={<RequirePermission permission="reports:view" />}>
              <Route path="reports" element={<ReportsPage />} />
            </Route>

            {/* Inventory - requires inventory:view */}
            <Route element={<RequirePermission permission="inventory:view" />}>
              <Route path="inventory" element={<InventoryPage />} />
            </Route>

            {/* Users/Team - requires users:view */}
            <Route element={<RequirePermission permission="users:view" />}>
              <Route path="users" element={<UsersPage />} />
            </Route>

            {/* Roles - requires roles:view */}
            <Route element={<RequirePermission permission="roles:view" />}>
              <Route path="roles" element={<RolesPage />} />
            </Route>

            {/* QR Codes - requires qr:view */}
            <Route element={<RequirePermission permission="qr:view" />}>
              <Route path="qr" element={<QrPage />} />
            </Route>

            {/* Fallback for unknown routes inside dashboard */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>

        {/* ─── Catch all - redirect to login ─── */}
        <Route path="*" element={<Navigate to="/login" replace />} />

        {/* ─── Super Admin Routes ─── */}
        <Route element={<ProtectedRoute />}>
          <Route path="superadmin" element={<SuperAdminLayout />}>
            <Route index element={<SuperAdminDashboard />} />
            <Route path="tenants" element={<TenantsListPage />} />
            <Route path="tenants/new" element={<CreateTenantPage />} />
            <Route path="tenants/:id" element={<TenantDetailPage />} />
          </Route>
        </Route>
      </Routes>
    </ToastProvider>
  );
}

// Default export for compatibility
export default App;
