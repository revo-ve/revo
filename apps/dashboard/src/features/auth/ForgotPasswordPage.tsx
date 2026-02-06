// ============================================
// REVO — Forgot Password Page
// ============================================
// Location: apps/dashboard/src/features/auth/ForgotPasswordPage.tsx
// ============================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import { useApi } from '../../hooks/useApi';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const { post } = useApi();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await post('/auth/forgot-password', { email: email.trim().toLowerCase() });
      setIsSuccess(true);
    } catch (err: any) {
      // Always show success to prevent email enumeration
      setIsSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

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
            Recuperar contraseña
          </h1>
          <p className="text-oliva-500 mt-1">
            Te enviaremos un enlace para restablecerla
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {isSuccess ? (
            // Success State
            <div className="text-center py-4">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-semibold text-bark mb-2">
                ¡Revisa tu correo!
              </h2>
              <p className="text-oliva-500 mb-6">
                Si existe una cuenta con <strong className="text-bark">{email}</strong>, 
                recibirás un enlace para restablecer tu contraseña.
              </p>
              <p className="text-sm text-oliva-400 mb-6">
                El enlace expirará en 1 hora. Revisa también tu carpeta de spam.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-arcilla-600 hover:text-arcilla-700 font-medium"
              >
                <ArrowLeft size={18} />
                Volver al login
              </Link>
            </div>
          ) : (
            // Form State
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-bark mb-1.5">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail 
                    size={18} 
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-oliva-400" 
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-sand rounded-xl bg-cream/50 focus:bg-white focus:border-arcilla-400 focus:ring-2 focus:ring-arcilla-100 transition-all outline-none"
                    placeholder="tu@email.com"
                    required
                    autoFocus
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !email}
                className="w-full py-3 px-4 bg-arcilla-500 hover:bg-arcilla-600 disabled:bg-arcilla-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Enviando...
                  </>
                ) : (
                  'Enviar enlace de recuperación'
                )}
              </button>

              {/* Back to Login */}
              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-oliva-500 hover:text-bark transition-colors text-sm"
                >
                  <ArrowLeft size={16} />
                  Volver al login
                </Link>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-oliva-400 mt-6">
          ¿Necesitas ayuda? Contacta al administrador de tu restaurante.
        </p>
      </div>
    </div>
  );
}
