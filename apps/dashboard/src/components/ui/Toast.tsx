// ============================================
// REVO — Toast Provider
// ============================================
// Location: apps/dashboard/src/components/ui/Toast.tsx
// ============================================

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// ─── Types ───
type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    toasts: Toast[];
    showToast: (message: string, type?: ToastType) => void;
    success: (message: string) => void;
    error: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
}

// ─── Context ───
const ToastContext = createContext<ToastContextType | null>(null);

// ─── Hook ───
export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
}

// ─── Provider ───
export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);
    let idCounter = 0;

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = ++idCounter;
        setToasts((prev) => [...prev, { id, message, type }]);

        // Auto remove after 3s
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);

    const success = useCallback((msg: string) => showToast(msg, 'success'), [showToast]);
    const error = useCallback((msg: string) => showToast(msg, 'error'), [showToast]);
    const warning = useCallback((msg: string) => showToast(msg, 'warning'), [showToast]);
    const info = useCallback((msg: string) => showToast(msg, 'info'), [showToast]);

    return (
        <ToastContext.Provider value={{ toasts, showToast, success, error, warning, info }}>
            {children}
            <ToastContainer toasts={toasts} />
        </ToastContext.Provider>
    );
}

// ─── Toast Container ───
function ToastContainer({ toasts }: { toasts: Toast[] }) {
    if (toasts.length === 0) return null;

    return (
        <div style={styles.container}>
            {toasts.map((toast) => (
                <div key={toast.id} style={{ ...styles.toast, ...styles[toast.type] }}>
                    <span style={styles.icon}>{icons[toast.type]}</span>
                    <span>{toast.message}</span>
                </div>
            ))}
        </div>
    );
}

// ─── Icons ───
const icons: Record<ToastType, string> = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
};

// ─── Styles ───
const styles: Record<string, React.CSSProperties> = {
    container: {
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        alignItems: 'center',
    },
    toast: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 24px',
        borderRadius: 12,
        fontSize: 14,
        fontWeight: 600,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        animation: 'slideUp 0.25s ease',
        fontFamily: "'Archivo', 'Inter', sans-serif",
    },
    icon: {
        fontSize: 16,
    },
    success: {
        background: '#3D4F2F',
        color: '#FFF',
    },
    error: {
        background: '#C0392B',
        color: '#FFF',
    },
    warning: {
        background: '#F5A623',
        color: '#FFF',
    },
    info: {
        background: '#3498DB',
        color: '#FFF',
    },
};