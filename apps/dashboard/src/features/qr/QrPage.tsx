// ============================================
// REVO — QR Management Page (Refactored)
// ============================================
// Location: apps/dashboard/src/features/qr/QrPage.tsx
// ============================================

import { useEffect, useState, useCallback } from 'react';
import { QrCode, Printer, Copy, Eye, RefreshCw, ExternalLink, X, Lightbulb } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useToast } from '@/components/ui/Toast';

const MENU_BASE_URL = 'http://localhost:5173/menu/qr';

// ─── Types ───
interface TableQr {
    id: string;
    number: string;
    zone: string;
    qrCode: string;
    status: string;
}

// ─── Helpers ───
const getQrImageUrl = (data: string, size = 200) =>
    `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}&margin=8&color=3D4F2F`;

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
    AVAILABLE: { label: 'Libre', bg: 'bg-salvia-500', text: 'text-white' },
    OCCUPIED: { label: 'Ocupada', bg: 'bg-arcilla-500', text: 'text-white' },
    RESERVED: { label: 'Reservada', bg: 'bg-miel-500', text: 'text-white' },
    CLEANING: { label: 'Limpieza', bg: 'bg-oliva-400', text: 'text-white' },
};

// ─── Main Component ───
export default function QrPage() {
    const [tables, setTables] = useState<TableQr[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterZone, setFilterZone] = useState('ALL');
    const [previewTable, setPreviewTable] = useState<TableQr | null>(null);

    const { get, post } = useApi();
    const { success, error } = useToast();

    const loadData = useCallback(async () => {
        try {
            const data = await get<TableQr[]>('/qr-management/tables');
            setTables(Array.isArray(data) ? data : (data as any)?.data || []);
        } catch (e: any) {
            error(e.message || 'Error cargando QR codes');
        } finally {
            setLoading(false);
        }
    }, [get, error]);

    useEffect(() => { loadData(); }, [loadData]);

    // Zones for filter
    const zones = ['ALL', ...new Set(tables.map((t) => t.zone))];
    const filtered = filterZone === 'ALL' ? tables : tables.filter((t) => t.zone === filterZone);

    // Group by zone
    const grouped: Record<string, TableQr[]> = {};
    for (const t of filtered) {
        if (!grouped[t.zone]) grouped[t.zone] = [];
        grouped[t.zone].push(t);
    }

    const getMenuUrl = (qrCode: string) => `${MENU_BASE_URL}/${qrCode}`;

    const copyLink = (qrCode: string) => {
        navigator.clipboard.writeText(getMenuUrl(qrCode));
        success('Enlace copiado');
    };

    const regenerateQr = async (tableId: string) => {
        try {
            await post(`/qr-management/tables/${tableId}/regenerate`, {});
            success('QR regenerado');
            loadData();
        } catch {
            error('Error al regenerar');
        }
    };

    const printQr = (table: TableQr) => {
        const url = getMenuUrl(table.qrCode);
        const qrImg = getQrImageUrl(url, 300);
        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>QR - Mesa ${table.number}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; text-align: center; padding: 40px; }
        .card { display: inline-block; border: 2px solid #3D4F2F; border-radius: 16px; padding: 32px; }
        h2 { color: #3D4F2F; margin: 0 0 4px; font-size: 22px; }
        p { color: #888; margin: 0 0 20px; font-size: 14px; }
        img { display: block; margin: 0 auto 16px; border-radius: 8px; }
        .mesa { font-size: 28px; font-weight: 800; color: #3D4F2F; margin: 16px 0 4px; }
        .hint { font-size: 12px; color: #999; }
        @media print { body { padding: 0; } }
      </style>
      </head>
      <body>
        <div class="card">
          <h2>📱 Escanea para ver el menú</h2>
          <p>${table.zone}</p>
          <img src="${qrImg}" width="250" height="250" />
          <div class="mesa">Mesa ${table.number}</div>
          <div class="hint">Apunta tu cámara al código QR</div>
        </div>
        <script>setTimeout(() => window.print(), 500);</script>
      </body>
      </html>
    `);
    };

    const printAll = () => {
        const qrCards = filtered.map((t) => {
            const url = getMenuUrl(t.qrCode);
            const qrImg = getQrImageUrl(url, 250);
            return `
        <div class="card">
          <h3>${t.zone} — Mesa ${t.number}</h3>
          <img src="${qrImg}" width="180" height="180" />
          <p>Escanea para ver el menú</p>
        </div>
      `;
        }).join('');

        const win = window.open('', '_blank');
        if (!win) return;
        win.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>QR Codes - Todas las mesas</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }
        .card { border: 2px solid #3D4F2F; border-radius: 12px; padding: 20px; text-align: center; page-break-inside: avoid; }
        h3 { color: #3D4F2F; margin: 0 0 10px; font-size: 14px; }
        img { border-radius: 6px; }
        p { font-size: 11px; color: #888; margin: 8px 0 0; }
        @media print { .grid { grid-template-columns: repeat(3, 1fr); } }
      </style>
      </head>
      <body>
        <div class="grid">${qrCards}</div>
        <script>setTimeout(() => window.print(), 1000);</script>
      </body>
      </html>
    `);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-3 border-arcilla-200 border-t-arcilla-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="p-6 min-h-screen bg-cream/30">
            {/* ── Header ── */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                <div>
                    <h1 className="text-2xl font-heading font-bold text-bark flex items-center gap-2">
                        <QrCode className="text-arcilla-500" /> Carta Digital & QR
                    </h1>
                    <p className="text-sm text-oliva-500 mt-0.5">{tables.length} mesas con QR code</p>
                </div>
                <button onClick={printAll} className="btn btn-primary">
                    <Printer size={18} /> Imprimir todos
                </button>
            </div>

            {/* ── Info Card ── */}
            <div className="flex gap-4 bg-miel-50 border border-miel-200 rounded-revo-lg p-4 mb-5">
                <Lightbulb className="text-miel-600 shrink-0" size={24} />
                <div>
                    <p className="font-semibold text-miel-700 mb-1">¿Cómo funciona?</p>
                    <p className="text-sm text-miel-600 leading-relaxed">
                        Cada mesa tiene un código QR único. Cuando el cliente lo escanea con su cámara, ve tu carta digital
                        completa directamente en su teléfono — sin instalar nada. Imprime los QR y colócalos en cada mesa.
                    </p>
                </div>
            </div>

            {/* ── Zone Filter ── */}
            <div className="flex flex-wrap gap-2 mb-5">
                {zones.map((z) => (
                    <button
                        key={z}
                        onClick={() => setFilterZone(z)}
                        className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                            filterZone === z
                                ? 'bg-bark text-white'
                                : 'bg-sand text-oliva-600 hover:bg-oliva-100'
                        }`}
                    >
                        {z === 'ALL' ? 'Todas' : z}
                    </button>
                ))}
            </div>

            {/* ── Tables Grid ── */}
            {Object.entries(grouped).map(([zone, zoneTables]) => (
                <div key={zone} className="mb-7">
                    <h3 className="font-heading font-bold text-bark mb-3">{zone}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {zoneTables.map((t) => (
                            <QrCard
                                key={t.id}
                                table={t}
                                menuUrl={getMenuUrl(t.qrCode)}
                                onCopy={() => copyLink(t.qrCode)}
                                onPrint={() => printQr(t)}
                                onPreview={() => setPreviewTable(t)}
                                onRegenerate={() => regenerateQr(t.id)}
                            />
                        ))}
                    </div>
                </div>
            ))}

            {/* ── Preview Modal ── */}
            {previewTable && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setPreviewTable(null)}>
                    <div className="bg-white rounded-revo-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-sand">
                            <h2 className="font-heading font-bold text-bark">Vista previa — Mesa {previewTable.number}</h2>
                            <button onClick={() => setPreviewTable(null)} className="w-8 h-8 flex items-center justify-center rounded-revo bg-sand text-oliva-500 hover:bg-oliva-100 transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="w-full h-[400px] rounded-revo-lg overflow-hidden border-2 border-sand mb-4">
                                <iframe
                                    src={getMenuUrl(previewTable.qrCode)}
                                    className="w-full h-full border-none"
                                    title="Menu preview"
                                />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <button onClick={() => copyLink(previewTable.qrCode)} className="flex-1 btn-secondary flex items-center justify-center gap-2">
                                    <Copy size={16} /> Copiar enlace
                                </button>
                                <button onClick={() => printQr(previewTable)} className="flex-1 btn-secondary flex items-center justify-center gap-2">
                                    <Printer size={16} /> Imprimir
                                </button>
                                <a
                                    href={getMenuUrl(previewTable.qrCode)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 btn-secondary flex items-center justify-center gap-2"
                                >
                                    <ExternalLink size={16} /> Abrir
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── QR Card ───
function QrCard({
                    table,
                    menuUrl,
                    onCopy,
                    onPrint,
                    onPreview,
                    onRegenerate,
                }: {
    table: TableQr;
    menuUrl: string;
    onCopy: () => void;
    onPrint: () => void;
    onPreview: () => void;
    onRegenerate: () => void;
}) {
    const statusCfg = STATUS_CONFIG[table.status] || { label: table.status, bg: 'bg-oliva-300', text: 'text-white' };

    return (
        <div className="card flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-3">
                <span className="font-heading font-bold text-lg text-bark">{table.number}</span>
                <span className={`badge text-xs ${statusCfg.bg} ${statusCfg.text}`}>{statusCfg.label}</span>
            </div>

            <div className="p-2 mb-3">
                <img
                    src={getQrImageUrl(menuUrl, 140)}
                    alt={`QR ${table.number}`}
                    className="rounded-revo"
                    loading="lazy"
                />
            </div>

            <div className="flex gap-2 w-full justify-center">
                <button onClick={onCopy} className="icon-btn" title="Copiar enlace">
                    <Copy size={16} />
                </button>
                <button onClick={onPrint} className="icon-btn" title="Imprimir QR">
                    <Printer size={16} />
                </button>
                <button onClick={onPreview} className="icon-btn" title="Ver menú">
                    <Eye size={16} />
                </button>
                <button onClick={onRegenerate} className="icon-btn text-miel-600 hover:bg-miel-50" title="Regenerar QR">
                    <RefreshCw size={16} />
                </button>
            </div>
        </div>
    );
}