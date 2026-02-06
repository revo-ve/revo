// ============================================
// REVO — API Hook
// ============================================
// Location: apps/dashboard/src/hooks/useApi.ts
// ============================================

import { useCallback } from 'react';

const API_URL = 'http://localhost:3000/api/v1';

// ─── Types ───
interface ApiOptions extends Omit<RequestInit, 'body'> {
    body?: any;
}

interface ApiError extends Error {
    status?: number;
    data?: any;
}

// ─── Hook ───
export function useApi() {
    const getToken = useCallback(() => {
        return localStorage.getItem('revo_access_token');
    }, []);

    const handleUnauthorized = useCallback(() => {
        localStorage.removeItem('revo_access_token');
        localStorage.removeItem('revo_refresh_token');
        window.location.href = '/login';
    }, []);

    const request = useCallback(async <T = any>(
        path: string,
        options: ApiOptions = {}
    ): Promise<T> => {
        const token = getToken();

        const { body, headers: customHeaders, ...restOptions } = options;

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...customHeaders,
        };

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const config: RequestInit = {
            ...restOptions,
            headers,
        };

        if (body) {
            config.body = JSON.stringify(body);
        }

        const response = await fetch(`${API_URL}${path}`, config);

        // Handle 401 - redirect to login
        if (response.status === 401) {
            handleUnauthorized();
            throw createError('Sesión expirada', 401);
        }

        // Parse response
        let data: any = null;
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
            data = await response.json();
        }

        // Handle errors
        if (!response.ok) {
            const message = data?.message || `Error ${response.status}`;
            throw createError(message, response.status, data);
        }

        return data as T;
    }, [getToken, handleUnauthorized]);

    // Convenience methods
    const get = useCallback(<T = any>(path: string, options?: ApiOptions) => {
        return request<T>(path, { ...options, method: 'GET' });
    }, [request]);

    const post = useCallback(<T = any>(path: string, body?: any, options?: ApiOptions) => {
        return request<T>(path, { ...options, method: 'POST', body });
    }, [request]);

    const put = useCallback(<T = any>(path: string, body?: any, options?: ApiOptions) => {
        return request<T>(path, { ...options, method: 'PUT', body });
    }, [request]);

    const patch = useCallback(<T = any>(path: string, body?: any, options?: ApiOptions) => {
        return request<T>(path, { ...options, method: 'PATCH', body });
    }, [request]);

    const del = useCallback(<T = any>(path: string, options?: ApiOptions) => {
        return request<T>(path, { ...options, method: 'DELETE' });
    }, [request]);

    return { request, get, post, put, patch, del };
}

// ─── Helper ───
function createError(message: string, status?: number, data?: any): ApiError {
    const error = new Error(message) as ApiError;
    error.status = status;
    error.data = data;
    return error;
}

// ─── Export type ───
export type { ApiError };