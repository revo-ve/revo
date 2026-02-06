// ============================================
// REVO — Menu Page (with Permissions)
// ============================================
// Location: apps/dashboard/src/features/menu/MenuPage.tsx
// ============================================

import { useState, useEffect } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  UtensilsCrossed,
  Search,
} from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { useToast } from '../../components/ui/Toast';
import { usePermissions } from '../../hooks/usePermissions';
import Modal, { ModalInput, ModalButton } from '../../components/ui/Modal';

// ─── Types ───
interface Product {
  id: string;
  categoryId: string;
  name: string;
  description: string | null;
  price: number;
  priceUsd: number | null;
  isAvailable: boolean;
  sortOrder: number;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  products: Product[];
}

// ─── Product Card ───
function ProductCard({
                       product,
                       onEdit,
                       onToggle,
                       onDelete,
                       canEdit,
                       canDelete,
                     }: {
  product: Product;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
  canEdit: boolean;
  canDelete: boolean;
}) {
  return (
      <div
          className={`card-hover flex items-center justify-between gap-4 transition-opacity ${
              !product.isAvailable ? 'opacity-50' : ''
          }`}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-ui font-semibold text-bark truncate">{product.name}</h4>
            {!product.isAvailable && (
                <span className="badge bg-oliva-100 text-oliva-600">Agotado</span>
            )}
          </div>
          {product.description && (
              <p className="text-sm text-oliva-500 mt-0.5 line-clamp-1">{product.description}</p>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
        <span className="font-ui font-bold text-arcilla-500 text-lg">
          ${Number(product.price).toFixed(2)}
        </span>
          <div className="flex items-center gap-1">
            {canEdit && (
                <button
                    onClick={onToggle}
                    className="p-1.5 rounded-revo-sm hover:bg-sand transition-colors"
                    title={product.isAvailable ? 'Marcar agotado' : 'Marcar disponible'}
                >
                  {product.isAvailable ? (
                      <Eye size={16} className="text-salvia-500" />
                  ) : (
                      <EyeOff size={16} className="text-oliva-400" />
                  )}
                </button>
            )}
            {canEdit && (
                <button
                    onClick={onEdit}
                    className="p-1.5 rounded-revo-sm hover:bg-sand transition-colors"
                >
                  <Pencil size={16} className="text-oliva-500" />
                </button>
            )}
            {canDelete && (
                <button
                    onClick={onDelete}
                    className="p-1.5 rounded-revo-sm hover:bg-arcilla-50 transition-colors"
                >
                  <Trash2 size={16} className="text-arcilla-400" />
                </button>
            )}
          </div>
        </div>
      </div>
  );
}

// ─── Main Component ───
export default function MenuPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{ type: 'category' | 'product'; id: string; name: string } | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodCategoryId, setProdCategoryId] = useState('');

  const { get, post, put, patch, del } = useApi();
  const { success, error } = useToast();

  // ─── Permissions ───
  const { can } = usePermissions();
  const canCreate = can('menu:create');
  const canEdit = can('menu:edit');
  const canDelete = can('menu:delete');

  // ─── Fetch Menu ───
  const fetchMenu = async () => {
    try {
      const res = await get<Category[]>('/menu/categories');
      const data = Array.isArray(res) ? res : (res as any)?.data || [];
      setCategories(data);

      // Expand all by default on first load
      if (expandedCats.size === 0 && data.length > 0) {
        setExpandedCats(new Set(data.map((c: Category) => c.id)));
      }
    } catch (err: any) {
      error(err.message || 'Error al cargar el menú');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const toggleCategory = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── Category CRUD ───
  const openNewCategory = () => {
    setEditingCategory(null);
    setCatName('');
    setCatDesc('');
    setShowCategoryModal(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatName(cat.name);
    setCatDesc(cat.description ?? '');
    setShowCategoryModal(true);
  };

  const saveCategory = async () => {
    if (!catName.trim()) {
      error('El nombre es obligatorio');
      return;
    }

    try {
      const payload = { name: catName.trim(), description: catDesc.trim() || null };

      if (editingCategory) {
        await put(`/menu/categories/${editingCategory.id}`, payload);
        success('Categoría actualizada');
      } else {
        await post('/menu/categories', payload);
        success('Categoría creada');
      }
      setShowCategoryModal(false);
      fetchMenu();
    } catch (err: any) {
      error(err.message || 'Error al guardar');
    }
  };

  const deleteCategory = async () => {
    if (!showDeleteModal || showDeleteModal.type !== 'category') return;

    try {
      await del(`/menu/categories/${showDeleteModal.id}`);
      success('Categoría eliminada');
      setShowDeleteModal(null);
      fetchMenu();
    } catch (err: any) {
      error(err.message || 'Error al eliminar');
    }
  };

  // ─── Product CRUD ───
  const openNewProduct = (categoryId: string) => {
    setEditingProduct(null);
    setProdName('');
    setProdDesc('');
    setProdPrice('');
    setProdCategoryId(categoryId);
    setShowProductModal(true);
  };

  const openEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdDesc(product.description ?? '');
    setProdPrice(product.price.toString());
    setProdCategoryId(product.categoryId);
    setShowProductModal(true);
  };

  const saveProduct = async () => {
    if (!prodName.trim()) {
      error('El nombre es obligatorio');
      return;
    }
    if (!prodPrice || parseFloat(prodPrice) <= 0) {
      error('El precio debe ser mayor a 0');
      return;
    }

    try {
      const payload = {
        name: prodName.trim(),
        description: prodDesc.trim() || null,
        price: parseFloat(prodPrice),
        categoryId: prodCategoryId,
      };

      if (editingProduct) {
        await put(`/menu/products/${editingProduct.id}`, payload);
        success('Producto actualizado');
      } else {
        await post('/menu/products', payload);
        success('Producto creado');
      }
      setShowProductModal(false);
      fetchMenu();
    } catch (err: any) {
      error(err.message || 'Error al guardar');
    }
  };

  const toggleProductAvailability = async (productId: string) => {
    try {
      await patch(`/menu/products/${productId}/toggle-availability`, {});
      success('Disponibilidad actualizada');
      fetchMenu();
    } catch (err: any) {
      error(err.message || 'Error al actualizar');
    }
  };

  const deleteProduct = async () => {
    if (!showDeleteModal || showDeleteModal.type !== 'product') return;

    try {
      await del(`/menu/products/${showDeleteModal.id}`);
      success('Producto eliminado');
      setShowDeleteModal(null);
      fetchMenu();
    } catch (err: any) {
      error(err.message || 'Error al eliminar');
    }
  };

  // ─── Filter ───
  const filteredCategories = categories
      .map((cat) => ({
        ...cat,
        products: (cat.products || []).filter(
            (p) =>
                !searchQuery ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
      }))
      .filter((cat) => !searchQuery || cat.products.length > 0);

  const totalProducts = categories.reduce((acc, c) => acc + (c.products?.length || 0), 0);

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-3 border-arcilla-200 border-t-arcilla-500 rounded-full animate-spin" />
        </div>
    );
  }

  return (
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-heading font-bold text-bark">Menú</h1>
            <p className="text-sm text-oliva-500 font-body mt-1">
              {categories.length} categorías · {totalProducts} productos
            </p>
          </div>
          {canCreate && (
              <button onClick={openNewCategory} className="btn btn-primary">
                <Plus size={18} />
                Nueva categoría
              </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-oliva-400" />
          <input
              type="text"
              placeholder="Buscar producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
          />
        </div>

        {/* Categories */}
        {filteredCategories.length === 0 ? (
            <div className="card text-center py-12">
              <UtensilsCrossed size={48} className="mx-auto text-oliva-300 mb-3" />
              <h3 className="font-heading font-semibold text-bark">
                {searchQuery ? 'Sin resultados' : 'Menú vacío'}
              </h3>
              <p className="text-sm text-oliva-500 mt-1">
                {searchQuery
                    ? 'Intenta con otra búsqueda'
                    : 'Comienza creando tu primera categoría'}
              </p>
              {!searchQuery && canCreate && (
                  <button onClick={openNewCategory} className="btn btn-primary mt-4">
                    <Plus size={18} />
                    Nueva categoría
                  </button>
              )}
            </div>
        ) : (
            <div className="space-y-4">
              {filteredCategories.map((cat) => (
                  <div key={cat.id} className="card !p-0 overflow-hidden">
                    {/* Category Header */}
                    <div
                        className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-sand/50 transition-colors"
                        onClick={() => toggleCategory(cat.id)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedCats.has(cat.id) ? (
                            <ChevronDown size={18} className="text-oliva-400" />
                        ) : (
                            <ChevronRight size={18} className="text-oliva-400" />
                        )}
                        <div>
                          <h3 className="font-heading font-semibold text-bark">{cat.name}</h3>
                          {cat.description && (
                              <p className="text-xs text-oliva-500">{cat.description}</p>
                          )}
                        </div>
                        <span className="badge bg-salvia-100 text-salvia-700 ml-2">
                    {cat.products?.length || 0}
                  </span>
                      </div>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        {canCreate && (
                            <button
                                onClick={() => openNewProduct(cat.id)}
                                className="p-1.5 rounded-revo-sm hover:bg-salvia-50 transition-colors"
                                title="Agregar producto"
                            >
                              <Plus size={16} className="text-salvia-500" />
                            </button>
                        )}
                        {canEdit && (
                            <button
                                onClick={() => openEditCategory(cat)}
                                className="p-1.5 rounded-revo-sm hover:bg-sand transition-colors"
                            >
                              <Pencil size={16} className="text-oliva-500" />
                            </button>
                        )}
                        {canDelete && (
                            <button
                                onClick={() => setShowDeleteModal({ type: 'category', id: cat.id, name: cat.name })}
                                className="p-1.5 rounded-revo-sm hover:bg-arcilla-50 transition-colors"
                            >
                              <Trash2 size={16} className="text-arcilla-400" />
                            </button>
                        )}
                      </div>
                    </div>

                    {/* Products */}
                    {expandedCats.has(cat.id) && (
                        <div className="border-t border-sand px-5 py-3 space-y-2">
                          {!cat.products || cat.products.length === 0 ? (
                              canCreate ? (
                                  <button
                                      onClick={() => openNewProduct(cat.id)}
                                      className="w-full py-6 border-2 border-dashed border-oliva-200 rounded-revo text-sm text-oliva-400 hover:border-arcilla-300 hover:text-arcilla-500 transition-colors"
                                  >
                                    + Agregar primer producto
                                  </button>
                              ) : (
                                  <p className="text-sm text-oliva-400 text-center py-6">
                                    Sin productos en esta categoría
                                  </p>
                              )
                          ) : (
                              cat.products.map((product) => (
                                  <ProductCard
                                      key={product.id}
                                      product={product}
                                      onEdit={() => openEditProduct(product)}
                                      onToggle={() => toggleProductAvailability(product.id)}
                                      onDelete={() => setShowDeleteModal({ type: 'product', id: product.id, name: product.name })}
                                      canEdit={canEdit}
                                      canDelete={canDelete}
                                  />
                              ))
                          )}
                        </div>
                    )}
                  </div>
              ))}
            </div>
        )}

        {/* ── Category Modal ── */}
        <Modal
            isOpen={showCategoryModal}
            onClose={() => setShowCategoryModal(false)}
            title={editingCategory ? 'Editar categoría' : 'Nueva categoría'}
            footer={
              <>
                <ModalButton variant="secondary" onClick={() => setShowCategoryModal(false)}>
                  Cancelar
                </ModalButton>
                <ModalButton onClick={saveCategory} disabled={!catName.trim()}>
                  {editingCategory ? 'Guardar' : 'Crear'}
                </ModalButton>
              </>
            }
        >
          <ModalInput
              label="Nombre"
              value={catName}
              onChange={setCatName}
              placeholder="Ej: Entradas, Platos principales..."
              required
          />
          <ModalInput
              label="Descripción (opcional)"
              value={catDesc}
              onChange={setCatDesc}
              placeholder="Breve descripción de la categoría"
          />
        </Modal>

        {/* ── Product Modal ── */}
        <Modal
            isOpen={showProductModal}
            onClose={() => setShowProductModal(false)}
            title={editingProduct ? 'Editar producto' : 'Nuevo producto'}
            footer={
              <>
                <ModalButton variant="secondary" onClick={() => setShowProductModal(false)}>
                  Cancelar
                </ModalButton>
                <ModalButton onClick={saveProduct} disabled={!prodName.trim() || !prodPrice}>
                  {editingProduct ? 'Guardar' : 'Crear'}
                </ModalButton>
              </>
            }
        >
          <ModalInput
              label="Nombre"
              value={prodName}
              onChange={setProdName}
              placeholder="Ej: Pabellón Criollo"
              required
          />
          <ModalInput
              label="Descripción (opcional)"
              value={prodDesc}
              onChange={setProdDesc}
              placeholder="Describe el plato..."
          />
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="label">Precio (USD)</label>
              <input
                  className="input"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select
                  className="input"
                  value={prodCategoryId}
                  onChange={(e) => setProdCategoryId(e.target.value)}
              >
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                ))}
              </select>
            </div>
          </div>
        </Modal>

        {/* ── Delete Confirmation Modal ── */}
        <Modal
            isOpen={!!showDeleteModal}
            onClose={() => setShowDeleteModal(null)}
            title={`Eliminar ${showDeleteModal?.type === 'category' ? 'categoría' : 'producto'}`}
            size="sm"
            footer={
              <>
                <ModalButton variant="secondary" onClick={() => setShowDeleteModal(null)}>
                  Cancelar
                </ModalButton>
                <ModalButton
                    variant="danger"
                    onClick={showDeleteModal?.type === 'category' ? deleteCategory : deleteProduct}
                >
                  Sí, eliminar
                </ModalButton>
              </>
            }
        >
          <p className="text-oliva-600">
            ¿Estás seguro de que quieres eliminar{' '}
            <strong className="text-bark">{showDeleteModal?.name}</strong>?
            {showDeleteModal?.type === 'category' && (
                <span className="block mt-2 text-sm text-arcilla-500">
              Esto también eliminará todos los productos de esta categoría.
            </span>
            )}
          </p>
        </Modal>
      </div>
  );
}