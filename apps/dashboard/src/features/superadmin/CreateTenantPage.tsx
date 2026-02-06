// ============================================
// REVO — Create Tenant Page (Super Admin)
// ============================================
// Location: apps/dashboard/src/features/superadmin/CreateTenantPage.tsx
// ============================================

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Building2,
  User,
  Mail,
  Link as LinkIcon,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';

export default function CreateTenantPage() {
  const navigate = useNavigate();
  const { post } = useApi();
  const { success, error } = useToast();

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [createdData, setCreatedData] = useState<{
    tenant: { name: string; slug: string };
    owner: { name: string; email: string };
  } | null>(null);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    // Generate slug: lowercase, replace spaces with dashes, remove special chars
    const generatedSlug = value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing dashes
    setSlug(generatedSlug);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !slug.trim() || !ownerName.trim() || !ownerEmail.trim()) {
      error('Todos los campos son obligatorios');
      return;
    }

    setIsLoading(true);

    try {
      const result = await post<{
        tenant: { id: string; name: string; slug: string };
        owner: { id: string; name: string; email: string };
        inviteSent: boolean;
      }>('/superadmin/tenants', {
        name: name.trim(),
        slug: slug.trim().toLowerCase(),
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim().toLowerCase(),
      });

      setCreatedData({
        tenant: result.tenant,
        owner: result.owner,
      });
      setIsSuccess(true);
      success('¡Restaurante creado exitosamente!');
    } catch (err: any) {
      error(err.message || 'Error al crear el restaurante');
    } finally {
      setIsLoading(false);
    }
  };

  // Success state
  if (isSuccess && createdData) {
    return (
      <div className="max-w-lg mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
            <Sparkles size={36} className="text-white" />
          </div>

          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            ¡Restaurante Creado!
          </h1>
          <p className="text-slate-500 mb-6">
            El restaurante ha sido configurado y se envió la invitación al dueño.
          </p>

          {/* Summary */}
          <div className="bg-slate-50 rounded-xl p-5 mb-6 text-left">
            <h3 className="font-semibold text-slate-900 mb-3">Resumen</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building2 size={18} className="text-violet-600" />
                <div>
                  <p className="text-sm text-slate-500">Restaurante</p>
                  <p className="font-medium text-slate-900">{createdData.tenant.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <LinkIcon size={18} className="text-violet-600" />
                <div>
                  <p className="text-sm text-slate-500">Menú digital</p>
                  <p className="font-medium text-slate-900">/menu/{createdData.tenant.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User size={18} className="text-violet-600" />
                <div>
                  <p className="text-sm text-slate-500">Dueño</p>
                  <p className="font-medium text-slate-900">{createdData.owner.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-violet-600" />
                <div>
                  <p className="text-sm text-slate-500">Email de invitación</p>
                  <p className="font-medium text-slate-900">{createdData.owner.email}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-700 text-left">
                Se ha enviado un email a <strong>{createdData.owner.email}</strong> con
                instrucciones para activar su cuenta y comenzar a configurar el restaurante.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => {
                setIsSuccess(false);
                setCreatedData(null);
                setName('');
                setSlug('');
                setOwnerName('');
                setOwnerEmail('');
              }}
              className="flex-1 px-4 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-medium rounded-xl transition-colors"
            >
              Crear otro
            </button>
            <Link
              to="/superadmin/tenants"
              className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-medium rounded-xl transition-colors text-center"
            >
              Ver restaurantes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Form state
  return (
    <div className="max-w-lg mx-auto">
      {/* Back link */}
      <Link
        to="/superadmin/tenants"
        className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        Volver a restaurantes
      </Link>

      {/* Form card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
            <Building2 size={24} className="text-violet-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Nuevo Restaurante</h1>
            <p className="text-sm text-slate-500">
              Configura el restaurante y su dueño
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Restaurant section */}
          <div className="pb-5 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Building2 size={16} />
              Datos del Restaurante
            </h3>

            {/* Name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre del restaurante *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="El Fogón de Luis"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Slug (URL del menú) *
              </label>
              <div className="flex items-center">
                <span className="px-3 py-2.5 bg-slate-100 border border-r-0 border-slate-200 rounded-l-xl text-sm text-slate-500">
                  /menu/
                </span>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) =>
                    setSlug(
                      e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '')
                    )
                  }
                  placeholder="el-fogon-de-luis"
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-r-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                  required
                />
              </div>
              <p className="text-xs text-slate-400 mt-1.5">
                Solo letras minúsculas, números y guiones
              </p>
            </div>
          </div>

          {/* Owner section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <User size={16} />
              Datos del Dueño
            </h3>

            {/* Owner name */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre completo *
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Luis García"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                required
              />
            </div>

            {/* Owner email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Email *
              </label>
              <input
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="luis@elfogon.com"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all outline-none"
                required
              />
              <p className="text-xs text-slate-400 mt-1.5">
                Se enviará un email de invitación a esta dirección
              </p>
            </div>
          </div>

          {/* Info box */}
          <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
            <p className="text-sm text-violet-700">
              <strong>¿Qué se creará?</strong>
              <br />
              • Restaurante con roles predeterminados (Dueño, Admin, Mesero, Cocinero)
              <br />
              • Usuario dueño con invitación por email
              <br />• Acceso al menú digital en /menu/{slug || 'slug'}
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading || !name || !slug || !ownerName || !ownerEmail}
            className="w-full py-3 px-4 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Sparkles size={20} />
                Crear Restaurante
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
