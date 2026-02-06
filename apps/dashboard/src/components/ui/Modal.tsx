// ============================================
// REVO — Modal Component
// ============================================
// Location: apps/dashboard/src/components/ui/Modal.tsx
// ============================================

import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';

// ─── Types ───
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    footer?: ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

// ─── Component ───
export default function Modal({
                                  isOpen,
                                  onClose,
                                  title,
                                  children,
                                  footer,
                                  size = 'md'
                              }: ModalProps) {
    // Close on Escape key
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEsc);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const maxWidths = {
        sm: 380,
        md: 480,
        lg: 600,
        xl: 800,
    };

    return (
        <div style={styles.overlay} onClick={onClose}>
            <div
                style={{ ...styles.modal, maxWidth: maxWidths[size] }}
                onClick={(e) => e.stopPropagation()}
                className="revo-modal"
            >
                {/* Header */}
                <div style={styles.header}>
                    <h3 style={styles.title}>{title}</h3>
                    <button onClick={onClose} style={styles.closeBtn}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={styles.body}>
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div style={styles.footer}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Button Components for Modal ───
interface ButtonProps {
    onClick: () => void;
    children: ReactNode;
    variant?: 'primary' | 'secondary' | 'danger';
    disabled?: boolean;
}

export function ModalButton({ onClick, children, variant = 'primary', disabled }: ButtonProps) {
    const variantStyles = {
        primary: { background: '#3D4F2F', color: '#FFF', border: 'none' },
        secondary: { background: '#FFF', color: '#666', border: '1px solid #E0DCD7' },
        danger: { background: '#C0392B', color: '#FFF', border: 'none' },
    };

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            style={{ ...styles.button, ...variantStyles[variant], opacity: disabled ? 0.6 : 1 }}
        >
            {children}
        </button>
    );
}

// ─── Form Components ───
interface InputProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    type?: string;
    required?: boolean;
    error?: string;
    disabled?: boolean; // ✅ Agregado
}

export function ModalInput({
                               label,
                               value,
                               onChange,
                               placeholder,
                               type = 'text',
                               required,
                               error,
                               disabled // ✅ Agregado
                           }: InputProps) {
    return (
        <div style={styles.field}>
            <label style={styles.label}>
                {label}
                {required && <span style={{ color: '#C0392B' }}> *</span>}
            </label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                disabled={disabled} // ✅ Agregado
                style={{
                    ...styles.input,
                    borderColor: error ? '#C0392B' : '#E0DCD7',
                    // ✅ Estilos para disabled
                    ...(disabled && {
                        background: '#F5F5F5',
                        color: '#999',
                        cursor: 'not-allowed',
                    })
                }}
                className="revo-input"
            />
            {error && <span style={styles.error}>{error}</span>}
        </div>
    );
}

interface SelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
    required?: boolean;
}

export function ModalSelect({ label, value, onChange, options, required }: SelectProps) {
    return (
        <div style={styles.field}>
            <label style={styles.label}>
                {label}
                {required && <span style={{ color: '#C0392B' }}> *</span>}
            </label>
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                style={styles.input}
                className="revo-input"
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
        </div>
    );
}

// ─── Styles ───
const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 20,
    },
    modal: {
        background: '#FFF',
        borderRadius: 16,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'hidden',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 24px',
        borderBottom: '1px solid #F0EDE8',
    },
    title: {
        fontSize: 17,
        fontWeight: 700,
        color: '#3D4F2F',
        margin: 0,
    },
    closeBtn: {
        width: 32,
        height: 32,
        border: 'none',
        background: '#F5F0EB',
        borderRadius: 8,
        cursor: 'pointer',
        color: '#666',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    body: {
        padding: 24,
        overflowY: 'auto',
        flex: 1,
    },
    footer: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: 10,
        padding: '16px 24px',
        borderTop: '1px solid #F0EDE8',
    },
    button: {
        padding: '10px 24px',
        borderRadius: 10,
        fontSize: 14,
        fontWeight: 600,
        cursor: 'pointer',
        fontFamily: 'inherit',
    },
    field: {
        marginBottom: 16,
    },
    label: {
        display: 'block',
        fontSize: 12,
        fontWeight: 600,
        color: '#666',
        marginBottom: 6,
    },
    input: {
        width: '100%',
        padding: '10px 14px',
        border: '1px solid #E0DCD7',
        borderRadius: 10,
        fontSize: 14,
        outline: 'none',
        fontFamily: 'inherit',
        boxSizing: 'border-box',
        background: '#FFF',
    },
    error: {
        display: 'block',
        fontSize: 12,
        color: '#C0392B',
        marginTop: 4,
    },
};