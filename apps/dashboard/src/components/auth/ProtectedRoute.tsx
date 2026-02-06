// ============================================
// REVO — Protected Route
// ============================================
// Location: apps/dashboard/src/components/auth/ProtectedRoute.tsx
// ============================================

import { Navigate, Outlet, useLocation } from 'react-router-dom';

// Simple token validation (checks expiration)
const isTokenValid = (token: string | null): boolean => {
    if (!token) return false;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000; // Convert to milliseconds
        return Date.now() < exp;
    } catch {
        return false;
    }
};

export default function ProtectedRoute() {
    const location = useLocation();
    const token = localStorage.getItem('revo_access_token');

    if (!isTokenValid(token)) {
        // Clear potentially invalid tokens
        localStorage.removeItem('revo_access_token');
        localStorage.removeItem('revo_refresh_token');

        // Redirect to login, preserving intended destination
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return <Outlet />;
}