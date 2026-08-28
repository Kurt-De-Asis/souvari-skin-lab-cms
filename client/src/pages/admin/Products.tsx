import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

interface Product {
  id: number;
  name: string;
  sku: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  price: number;
  status: string;
}

interface ProductForm {
  name: string;
  category: string;
  unit: string;
  current_stock: number;
  minimum_stock: number;
  price: number;
  status: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ProductForm>({
    defaultValues: { name: '', category: '', unit: 'pcs', current_stock: 0, minimum_stock: 0, price: 0, status: 'active' },
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (categoryFilter) params.category = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (lowStockOnly) params.low_stock = 'true';
      const { data } = await productsApi.list(params);
      setProducts(data.data?.products || data.data?.data || []);
      setTotalPages(data.data?.totalPages || data.data?.pagination?.totalPages || 1);
      setTotal(data.data?.total || data.data?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, statusFilter, lowStockOnly]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { setPage(1); }, [categoryFilter, statusFilter, lowStockOnly]);

  const openAddModal = () => {
    setEditingProduct(null);
    reset({ name: '', category: '', unit: 'pcs', current_stock: 0, minimum_stock: 0, price: 0, status: 'active' });
    setModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    reset({
      name: p.name,
      category: p.category,
      unit: p.unit,
      current_stock: p.current_stock,
      minimum_stock: p.minimum_stock,
      price: p.price,
      status: p.status,
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: ProductForm) => {
    setSubmitting(true);
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, values);
        toast.success('Product updated');
      } else {
        await productsApi.create(values);
        toast.success('Product created');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const isLowStock = (p: Product) => p.current_stock <= p.minimum_stock;

  const formatPrice = (price: number) => `₱${Number(price).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage products and stock levels</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <Plus size={18} />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="card pb-0">
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <select className="select-field w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            <option value="skincare">Skincare</option>
            <option value="supplements">Supplements</option>
            <option value="equipment">Equipment</option>
            <option value="consumables">Consumables</option>
            <option value="tools">Tools</option>
            <option value="other">Other</option>
          </select>
          <select className="select-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discontinued">Discontinued</option>
          </select>
          <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <AlertTriangle size={14} className="text-red-500" />
            Low stock only
          </label>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : products.length === 0 ? (
          <EmptyState title="No products found" description="Add a new product or adjust your filters." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">SKU</th>
                  <th className="px-6 py-3 font-medium">Category</th>
                  <th className="px-6 py-3 font-medium">Unit</th>
                  <th className="px-6 py-3 font-medium">Stock</th>
                  <th className="px-6 py-3 font-medium">Min Stock</th>
                  <th className="px-6 py-3 font-medium">Price</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {products.map((p) => {
                  const low = isLowStock(p);
                  return (
                    <tr key={p.id} className={`hover:bg-neutral-50/50 ${low ? 'bg-red-50/30' : ''}`}>
                      <td className="px-6 py-4 font-medium text-neutral-900">
                        <div className="flex items-center gap-2">
                          {low && <AlertTriangle size={14} className="text-red-500 shrink-0" />}
                          {p.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-500 font-mono text-xs">{p.sku}</td>
                      <td className="px-6 py-4 text-neutral-600 capitalize">{p.category || '—'}</td>
                      <td className="px-6 py-4 text-neutral-600">{p.unit}</td>
                      <td className="px-6 py-4">
                        <span className={`font-medium ${low ? 'text-red-600' : 'text-neutral-900'}`}>
                          {p.current_stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-neutral-500">{p.minimum_stock}</td>
                      <td className="px-6 py-4 text-neutral-600">{formatPrice(p.price)}</td>
                      <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end">
                          <button onClick={() => openEditModal(p)} title="Edit" className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
                            <Pencil size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {!loading && products.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add Product'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Name</label>
            <input className="input-field" placeholder="Product name" {...register('name', { required: 'Required' })} />
            {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Category</label>
              <select className="select-field" {...register('category', { required: 'Required' })}>
                <option value="">Select category</option>
                <option value="skincare">Skincare</option>
                <option value="supplements">Supplements</option>
                <option value="equipment">Equipment</option>
                <option value="consumables">Consumables</option>
                <option value="tools">Tools</option>
                <option value="other">Other</option>
              </select>
              {errors.category && <p className="text-xs text-red-600 mt-1">{errors.category.message}</p>}
            </div>
            <div>
              <label className="label">Unit</label>
              <select className="select-field" {...register('unit')}>
                <option value="pcs">Pieces</option>
                <option value="bottles">Bottles</option>
                <option value="tubes">Tubes</option>
                <option value="boxes">Boxes</option>
                <option value="ml">Milliliters</option>
                <option value="g">Grams</option>
                <option value="kg">Kilograms</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="label">Current Stock</label>
              <input type="number" className="input-field" {...register('current_stock', { required: 'Required', valueAsNumber: true })} />
              {errors.current_stock && <p className="text-xs text-red-600 mt-1">{errors.current_stock.message}</p>}
            </div>
            <div>
              <label className="label">Min Stock</label>
              <input type="number" className="input-field" {...register('minimum_stock', { required: 'Required', valueAsNumber: true })} />
              {errors.minimum_stock && <p className="text-xs text-red-600 mt-1">{errors.minimum_stock.message}</p>}
            </div>
            <div>
              <label className="label">Price (₱)</label>
              <input type="number" step="0.01" className="input-field" {...register('price', { required: 'Required', valueAsNumber: true })} />
              {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Status</label>
              <select className="select-field" {...register('status')}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="discontinued">Discontinued</option>
              </select>
            </div>
            {editingProduct && (
              <div>
                <label className="label">SKU</label>
                <input className="input-field bg-neutral-50" value={editingProduct.sku} disabled />
                <p className="text-xs text-neutral-400 mt-1">Auto-generated on creation</p>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editingProduct ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
