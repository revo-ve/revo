// ============================================
// REVO — Login Page
// ============================================
// Location: apps/dashboard/src/pages/LoginPage.tsx
// ============================================

import { useState } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {useAuthStore} from "@/stores/auth.store";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="min-h-screen flex items-center justify-center bg-cream p-4">
        <div className="w-full max-w-sm">
          <div className="bg-white rounded-revo-lg shadow-lg p-8">
            {/* Logo */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-revo bg-arcilla-500 mb-3">
                <span className="text-white text-2xl font-heading font-black">R</span>
              </div>
              <h1 className="text-2xl font-heading font-bold text-bark">Iniciar sesión</h1>
            </div>

            {/* Error */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-revo text-sm">
                  {error}
                </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-bark mb-1.5">Email</label>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-sand rounded-revo focus:outline-none focus:ring-2 focus:ring-salvia-300 focus:border-salvia-400 transition-all"
                    placeholder="tu@email.com"
                    required
                    autoComplete="email"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-bark mb-1.5">Contraseña</label>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-sand rounded-revo focus:outline-none focus:ring-2 focus:ring-salvia-300 focus:border-salvia-400 transition-all"
                    placeholder="••••••••"
                    required
                    autoComplete="current-password"
                />
              </div>

              <div className="flex justify-end -mt-2">
                <Link
                    to="/forgot-password"
                    className="text-sm text-arcilla-600 hover:text-arcilla-700 hover:underline"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

              <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-arcilla-500 text-white font-semibold rounded-revo hover:bg-arcilla-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            {/* Demo credentials */}
            <p className="mt-6 text-center text-sm text-oliva-400">
              Demo: luis@revo.com / Admin123!
            </p>
          </div>
        </div>
      </div>
  );
}