// ============================================
// REVO — Auth Store (Zustand)
// ============================================
// Location: apps/dashboard/src/stores/auth.store.ts
// ============================================

import {create} from 'zustand';
import {persist} from 'zustand/middleware';

const API = 'http://localhost:3000/api/v1';

// ─── Types ───
interface RolePermission {
    code: string;
}

interface Role {
    id: string;
    name: string;
    color: string;
    permissions: RolePermission[];
}

interface AuthUser {
    id: string;
    tenantId: string;
    email: string;
    name: string;
    role: Role;
}

interface LoginCredentials {
    email: string;
    password: string;
}

interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

interface AuthState {
    user: AuthUser | null;
    accessToken: string | null;
    refreshToken: string | null;

    // Actions
    setUser: (user: AuthUser | null) => void;
    setTokens: (accessToken: string, refreshToken: string) => void;
    login: (credentials: LoginCredentials) => Promise<void>;
    logout: () => void;
    isAuthenticated: () => boolean;
}

// ─── Store ───
export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,

            setUser: (user) => set({user}),

            setTokens: (accessToken, refreshToken) => {
                localStorage.setItem('revo_access_token', accessToken);
                localStorage.setItem('revo_refresh_token', refreshToken);
                set({accessToken, refreshToken});
            },

            login: async (credentials: LoginCredentials) => {
                const response = await fetch(`${API}/auth/login`, {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(credentials),
                });

                if (!response.ok) {
                    const error = await response.json().catch(() => ({}));
                    throw new Error(error.message || 'Error al iniciar sesión');
                }

                const result = await response.json();
                const data: LoginResponse = result.data;  // ← AQUÍ está el fix

                // Save tokens
                localStorage.setItem('revo_access_token', data.accessToken);
                localStorage.setItem('revo_refresh_token', data.refreshToken);

                // Update state
                set({
                    user: data.user,
                    accessToken: data.accessToken,
                    refreshToken: data.refreshToken,
                });
            },

            logout: () => {
                localStorage.removeItem('revo_access_token');
                localStorage.removeItem('revo_refresh_token');
                set({user: null, accessToken: null, refreshToken: null});
            },

            isAuthenticated: () => {
                const token = localStorage.getItem('revo_access_token');
                return !!token;
            },
        }),
        {
            name: 'revo-auth',
            partialize: (state) => ({
                user: state.user,
                accessToken: state.accessToken,
                refreshToken: state.refreshToken,
            }),
        }
    )
);