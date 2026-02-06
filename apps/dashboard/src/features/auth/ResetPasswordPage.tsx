// ============================================
// REVO — Reset Password Page
// ============================================
// Location: apps/dashboard/src/features/auth/ResetPasswordPage.tsx
// ============================================

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, Eye, EyeOff, CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { useApi } from '../../hooks/useApi';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [error, setError] = useState('');
  
  const { post } = useApi();

  // Verify token on mount
  useEffect(() => {
    if (!token) {
      setIsVerifying(false);
      setIsValid(false);
      return;
    }

    const verifyToken = async () => {
      try {
        const response = await post<{ valid: boolean; email: string }>('/auth/verify-reset-token', { token });
        setIsValid(response.valid);
        setMaskedEmail(response.email || '');
      } catch {
        setIsValid(false);
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
      await post('/auth/reset-password', { token, password });
      setIsSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña');
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
          <p className="text-oliva-500">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (!isValid) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle size={32} className="text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-bark mb-2">
              Enlace inválido o expirado
            </h2>
            <p className="text-oliva-500 mb-6">
              Este enlace de recuperación ya no es válido. 
              Los enlaces expiran después de 1 hora.
            </p>
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 bg-arcilla-500 hover:bg-arcilla-600 text-white font-semibold rounded-xl transition-colors"
            >
              Solicitar nuevo enlace
            </Link>
            <div className="mt-4">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-oliva-500 hover:text-bark transition-colors text-sm"
              >
                <ArrowLeft size={16} />
                Volver al login
              </Link>
            </div>
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-bark mb-2">
              ¡Contraseña actualizada!
            </h2>
            <p className="text-oliva-500 mb-6">
              Tu contraseña ha sido restablecida correctamente.
              Ya puedes iniciar sesión con tu nueva contraseña.
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-bark rounded-2xl mb-4">
            <span className="text-2xl font-heading font-black">
              <span className="text-arcilla-400">R</span>
              <span className="text-white">E</span>
            </span>
          </div>
          <h1 className="text-2xl font-heading font-bold text-bark">
            Nueva contraseña
          </h1>
          {maskedEmail && (
            <p className="text-oliva-500 mt-1">
              Para la cuenta: <strong className="text-bark">{maskedEmail}</strong>
            </p>
          )}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-bark mb-1.5">
                Nueva contraseña
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
                  Actualizando...
                </>
              ) : (
                'Establecer nueva contraseña'
              )}
            </button>
          </form>
        </div>
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
