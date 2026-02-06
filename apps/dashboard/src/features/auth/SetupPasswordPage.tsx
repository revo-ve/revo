// ============================================
// REVO — Setup Password Page (for invited users)
// ============================================
// Location: apps/dashboard/src/features/auth/SetupPasswordPage.tsx
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2, Sparkles } from 'lucide-react';
import { useApi } from '../../hooks/useApi';

interface InviteInfo {
  valid: boolean;
  email: string;
  name: string;
  tenantName: string;
}

export default function SetupPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const { post } = useApi();

  // Verify invite token on mount
  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await post<InviteInfo>('/auth/verify-invite', { token });
        setInviteInfo(response);
      } catch {
        setInviteInfo(null);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token, post]);

  // Password validation
  const passwordValidation = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    matches: password === confirmPassword && password.length > 0,
  };

  const isPasswordValid = passwordValidation.minLength && passwordValidation.matches;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      setError('Por favor corrige los errores en la contraseña');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      await post('/auth/setup-password', { token, password });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al configurar la cuenta');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <Loader2 size={40} className="animate-spin text-arcilla-500 mx-auto mb-4" />
          <p className="text-oliva-500">Verificando invitación...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!inviteInfo) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-bark mb-2">
              Invitación inválida o expirada
            </h2>
            <p className="text-oliva-500 mb-6">
              Esta invitación ya no es válida. 
              Las invitaciones expiran después de 7 días.
            </p>
            <p className="text-sm text-oliva-400 mb-6">
              Contacta al administrador de tu restaurante para que te envíe una nueva invitación.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-arcilla-500 hover:bg-arcilla-600 text-white font-semibold rounded-xl transition-colors"
            >
              Ir al login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
              <Sparkles size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-heading font-bold text-bark mb-2">
              ¡Bienvenido a REVO!
            </h2>
            <p className="text-oliva-500 mb-2">
              Tu cuenta en <strong className="text-bark">{inviteInfo.tenantName}</strong> está lista.
            </p>
            <p className="text-sm text-oliva-400 mb-6">
              Ya puedes iniciar sesión con tu email y la contraseña que configuraste.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full py-3 px-4 bg-arcilla-500 hover:bg-arcilla-600 text-white font-semibold rounded-xl transition-colors"
            >
              Iniciar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-bark rounded-2xl mb-4">
            <span className="text-2xl font-heading font-black">
              <span className="text-arcilla-400">R</span>
              <span className="text-white">E</span>
            </span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-bark">
            ¡Hola {inviteInfo.name.split(' ')[0]}!
          </h1>
          <p className="text-oliva-500 mt-1">
            Configura tu cuenta para{' '}
            <strong className="text-bark">{inviteInfo.tenantName}</strong>
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Welcome message */}
          <div className="bg-gradient-to-r from-arcilla-50 to-cream rounded-xl p-4 mb-6">
            <p className="text-sm text-oliva-600">
              <strong className="text-bark">¡Bienvenido al equipo!</strong>
              <br />
              Solo necesitas crear una contraseña para activar tu cuenta.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Email (readonly) */}
            <div>
              <label className="block text-sm font-medium text-bark mb-1.5">
                Tu correo
              </label>
              <input
                type="email"
                value={inviteInfo.email}
                disabled
                className="w-full px-4 py-3 border border-sand rounded-xl bg-sand/50 text-oliva-600 cursor-not-allowed"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-bark mb-1.5">
                Crea tu contraseña
              </label>
              <div className="relative">
                <Lock 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-oliva-400" 
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-sand rounded-xl bg-cream/50 focus:bg-white focus:border-arcilla-400 focus:ring-2 focus:ring-arcilla-100 transition-all outline-none"
                  placeholder="••••••••"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-oliva-400 hover:text-oliva-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-bark mb-1.5">
                Confirmar contraseña
              </label>
              <div className="relative">
                <Lock 
                  size={18} 
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-oliva-400" 
                />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-sand rounded-xl bg-cream/50 focus:bg-white focus:border-arcilla-400 focus:ring-2 focus:ring-arcilla-100 transition-all outline-none"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-oliva-400 hover:text-oliva-600"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Password Requirements */}
            <div className="bg-cream/50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-medium text-oliva-600 mb-2">Requisitos:</p>
              <PasswordCheck 
                passed={passwordValidation.minLength} 
                label="Mínimo 8 caracteres" 
              />
              <PasswordCheck 
                passed={passwordValidation.matches} 
                label="Las contraseñas coinciden" 
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isPasswordValid}
              className="w-full py-3 px-4 bg-arcilla-500 hover:bg-arcilla-600 disabled:bg-arcilla-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Activando cuenta...
                </>
              ) : (
                'Activar mi cuenta'
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-oliva-400 mt-6">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-arcilla-600 hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}

// Helper component
function PasswordCheck({ passed, label }: { passed: boolean; label: string }) {
  return (
    <div className={`flex items-center gap-2 text-sm ${passed ? 'text-green-600' : 'text-oliva-400'}`}>
      {passed ? (
        <CheckCircle size={14} className="text-green-500" />
      ) : (
        <div className="w-3.5 h-3.5 rounded-full border border-oliva-300" />
      )}
      {label}
    </div>
  );
}
