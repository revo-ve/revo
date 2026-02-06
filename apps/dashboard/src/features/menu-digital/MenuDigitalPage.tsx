// ============================================
// REVO — Digital Menu (Public, Mobile-First)
// ============================================
// Location: apps/menu-digital/src/MenuDigitalPage.tsx
// ============================================

import { useEffect, useState, useRef } from 'react';
import { Search, MapPin, Phone, Utensils } from 'lucide-react';

const API = 'http://localhost:3000/api/v1';

// ─── Types ───
interface Product {
    id: string;
    name: string;
    description: string | null;
    image: string | null;
    price: number;
    priceUsd: number | null;
}

interface Category {
    id: string;
    name: string;
    description: string | null;
    products: Product[];
}

interface Restaurant {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    phone: string | null;
    address: string | null;
    currency: string;
}

interface TableInfo {
    id: string;
    number: string;
    zone: string | null;
}

// ─── Helpers ───
const formatPrice = (n: number, currency: string) => {
    if (currency === 'USD') return `$${n.toFixed(2)}`;
    return `Bs. ${n.toFixed(2)}`;
};

const getParams = () => {
    const path = window.location.pathname;
    const search = new URLSearchParams(window.location.search);
    const slugMatch = path.match(/\/menu\/([^/]+)$/);
    const qrMatch = path.match(/\/menu\/qr\/(.+)$/);

    return {
        slug: slugMatch?.[1] || search.get('slug') || null,
        qrCode: qrMatch?.[1] || search.get('qr') || null,
    };
};

// ─── Main Component ───
export default function MenuDigitalPage() {
    const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
    const [table, setTable] = useState<TableInfo | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});

    useEffect(() => {
        const load = async () => {
            try {
                const { slug, qrCode } = getParams();
                let data: any;

                if (qrCode) {
                    const res = await fetch(`${API}/public/menu/qr/${encodeURIComponent(qrCode)}`);
                    if (!res.ok) throw new Error('Mesa no encontrada');
                    data = await res.json();
                    setTable(data.table);
                } else if (slug) {
                    const res = await fetch(`${API}/public/menu/slug/${encodeURIComponent(slug)}`);
                    if (!res.ok) throw new Error('Restaurante no encontrado');
                    data = await res.json();
                } else {
                    throw new Error('URL inválida');
                }

                setRestaurant(data.restaurant);
                setCategories(data.menu);
                if (data.menu.length > 0) setActiveCategory(data.menu[0].id);
            } catch (e: any) {
                setError(e.message || 'Error al cargar el menú');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const scrollToCategory = (catId: string) => {
        setActiveCategory(catId);
        setSearchQuery('');
        const el = categoryRefs.current[catId];
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    // Filter products by search
    const filteredCategories = searchQuery
        ? categories
            .map((cat) => ({
                ...cat,
                products: cat.products.filter(
                    (p) =>
                        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                ),
            }))
            .filter((cat) => cat.products.length > 0)
        : categories;

    if (loading) return <LoadingState />;
    if (error) return <ErrorState message={error} />;

    return (
        <div className="font-body max-w-[480px] mx-auto min-h-screen bg-cream">
            {/* ── Hero Header ── */}
            <header className="bg-gradient-to-br from-bark to-salvia-600 px-6 pt-10 pb-8 text-center text-white">
                {restaurant?.logo && (
                    <img
                        src={restaurant.logo}
                        alt=""
                        className="w-[72px] h-[72px] rounded-2xl object-cover mx-auto mb-3 border-[3px] border-white/20"
                    />
                )}
                <h1 className="text-2xl font-heading font-extrabold tracking-tight">
                    {restaurant?.name}
                </h1>
                {restaurant?.address && (
                    <p className="text-sm text-white/85 mt-2 flex items-center justify-center gap-1">
                        <MapPin size={14} /> {restaurant.address}
                    </p>
                )}
                {table && (
                    <div className="inline-flex items-center gap-2 mt-3 px-4 py-1.5 bg-white/15 rounded-full text-sm font-semibold">
                        <Utensils size={14} />
                        {table.zone ? `${table.zone} — ` : ''}Mesa {table.number}
                    </div>
                )}
            </header>

            {/* ── Search ── */}
            <div className="sticky top-0 z-10 bg-cream px-4 pt-4">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-oliva-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar en el menú..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 border border-sand rounded-xl text-[15px] bg-white focus:outline-none focus:ring-2 focus:ring-salvia-300 focus:border-salvia-400 transition-all"
                    />
                </div>
            </div>

            {/* ── Category Navigation ── */}
            {!searchQuery && categories.length > 0 && (
                <nav className="sticky top-[68px] z-[9] bg-cream py-3">
                    <div className="flex gap-2 overflow-x-auto px-4 scrollbar-hide">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => scrollToCategory(cat.id)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                                    activeCategory === cat.id
                                        ? 'bg-bark text-white'
                                        : 'bg-sand text-bark hover:bg-oliva-100'
                                }`}
                            >
                                {cat.name}
                            </button>
                        ))}
                    </div>
                </nav>
            )}

            {/* ── Menu Content ── */}
            <main className="px-4 pt-2 pb-6">
                {filteredCategories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-oliva-400">
                        <Search size={40} className="opacity-50 mb-2" />
                        <p>No se encontraron platos</p>
                    </div>
                ) : (
                    filteredCategories.map((cat) => (
                        <section
                            key={cat.id}
                            ref={(el) => { // @ts-ignore
                                categoryRefs.current[cat.id] = el; }}
                            className="mb-7"
                        >
                            <div className="mb-3 pt-2">
                                <h2 className="text-xl font-heading font-extrabold text-bark">{cat.name}</h2>
                                {cat.description && (
                                    <p className="text-sm text-oliva-400 mt-1">{cat.description}</p>
                                )}
                            </div>

                            <div className="space-y-3">
                                {cat.products.map((product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        currency={restaurant?.currency || 'USD'}
                                    />
                                ))}
                            </div>
                        </section>
                    ))
                )}
            </main>

            {/* ── Footer ── */}
            <footer className="text-center px-6 py-8 border-t border-sand">
                {restaurant?.phone && (
                    <p className="text-sm text-oliva-500 flex items-center justify-center gap-1 mb-2">
                        <Phone size={14} /> {restaurant.phone}
                    </p>
                )}
                <p className="text-xs text-oliva-300">
                    Impulsado por <span className="font-heading font-bold">REVO</span>
                </p>
            </footer>
        </div>
    );
}

// ─── Product Card ───
function ProductCard({ product, currency }: { product: Product; currency: string }) {
    return (
        <div className="flex bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {product.image && (
                <div className="w-[100px] min-h-[100px] flex-shrink-0">
                    <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                </div>
            )}
            <div className="p-4 flex flex-col justify-center flex-1">
                <h3 className="text-[15px] font-bold text-bark mb-1">{product.name}</h3>
                {product.description && (
                    <p className="text-sm text-oliva-400 line-clamp-2 mb-2">{product.description}</p>
                )}
                <div className="flex items-center gap-2.5">
          <span className="text-base font-extrabold text-bark">
            {formatPrice(product.price, currency)}
          </span>
                    {product.priceUsd && currency !== 'USD' && (
                        <span className="text-xs text-oliva-400">${product.priceUsd.toFixed(2)}</span>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Loading State ───
function LoadingState() {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-cream">
            <div className="w-10 h-10 border-[3px] border-sand border-t-bark rounded-full animate-spin" />
            <p className="text-oliva-400 mt-4 text-sm">Cargando menú...</p>
        </div>
    );
}

// ─── Error State ───
function ErrorState({ message }: { message: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-cream px-6 text-center">
            <span className="text-6xl mb-4">😕</span>
            <h2 className="text-xl font-heading font-bold text-bark mb-2">{message}</h2>
            <p className="text-sm text-oliva-400">Verifica el enlace o escanea el QR de nuevo</p>
        </div>
    );
}