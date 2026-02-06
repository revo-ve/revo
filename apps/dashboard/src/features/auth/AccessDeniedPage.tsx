// ============================================
// REVO — Access Denied Page
// ============================================
// Location: apps/dashboard/src/features/auth/AccessDeniedPage.tsx
// ============================================

import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuthStore } from '../../stores/auth.store';

export default function AccessDeniedPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  // Get info from navigation state
  const from = (location.state as any)?.from?.pathname || '/';
  const requiredPermission = (location.state as any)?.requiredPermission;

  const handleGoBack = () => {
    // Go back in history, or to home if no history
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-arcilla-100 flex items-center justify-center">
          <ShieldX size={40} className="text-arcilla-500" />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-heading font-bold text-bark mb-2">
          Acceso Denegado
        </h1>

        {/* Message */}
        <p className="text-oliva-600 mb-6">
          No tienes permisos para acceder a esta sección.
          {user?.role?.name && (
            <span className="block mt-2 text-sm">
              Tu rol actual es: <strong className="text-bark">{user.role.name}</strong>
            </span>
          )}
        </p>

        {/* Info card */}
        <div className="bg-white rounded-revo p-4 mb-6 text-left border border-sand">
          <p className="text-sm text-oliva-500 mb-2">
            <strong className="text-bark">¿Por qué veo esto?</strong>
          </p>
          <ul className="text-sm text-oliva-500 space-y-1">
            <li>• Tu rol no tiene acceso a esta función</li>
            <li>• El administrador puede ajustar tus permisos</li>
            <li>• Contacta al dueño si necesitas acceso</li>
          </ul>
          {requiredPermission && (
            <p className="text-xs text-oliva-400 mt-3 pt-3 border-t border-sand">
              Permiso requerido: <code className="bg-sand px-1 rounded">{
                Array.isArray(requiredPermission) 
                  ? requiredPermission.join(' o ') 
                  : requiredPermission
              }</code>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <button
            onClick={handleGoBack}
            className="btn btn-outline flex items-center gap-2"
          >
            <ArrowLeft size={18} />
            Volver
          </button>
          <button
            onClick={handleGoHome}
            className="btn btn-primary flex items-center gap-2"
          >
            <Home size={18} />
            Ir al inicio
          </button>
        </div>

        {/* Footer hint */}
        <p className="text-xs text-oliva-400 mt-8">
          Si crees que esto es un error, contacta al administrador del sistema.
        </p>
      </div>
    </div>
  );
}
