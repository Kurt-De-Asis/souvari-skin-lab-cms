import { useState, useEffect, useCallback } from 'react';
import { ShoppingCart, AlertTriangle, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { productsApi, customersApi, transactionsApi } from '@/api';
import { formatAmountInput } from '../../utils/format';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Drawer from '@/components/ui/Drawer';

interface Category {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  product_category_id: number | null;
  category: Category | null;
  unit: string;
  current_stock: number | string;
  minimum_stock: number | string;
  unit_price: number | string;
  status: string;
}

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [search, setSearch] = useState('');

  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountTendered, setAmountTendered] = useState('');
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    customersApi.list({ limit: '100' }).then((res) => {
      const list = res.data?.data?.data || res.data?.data || res.data || [];
      setCustomers(Array.isArray(list) ? list : []);
    }).catch(() => {});
  }, []);

  const addToCart = (p: Product) => {
    if (Number(p.current_stock) <= 0) {
      toast.error('Product is out of stock');
      return;
    }
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === p.id);
      if (existing) {
        if (existing.quantity >= Number(p.current_stock)) {
          toast.error('Cannot exceed available stock');
          return prev;
        }
        return prev.map((item) =>
          item.product.id === p.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product: p, quantity: 1 }];
    });
    toast.success(`Added ${p.name} to cart`);
  };

  const updateCartQty = (productId: number, qty: number) => {
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    const target = cartItems.find((item) => item.product.id === productId);
    if (target && qty > Number(target.product.current_stock)) {
      toast.error('Cannot exceed available stock');
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
    );
  };

  const cartSubtotal = cartItems.reduce((sum, item) => sum + Number(item.product.unit_price) * item.quantity, 0);
  const tendered = parseFloat(amountTendered.replace(/,/g, '')) || 0;
  const change = Math.max(0, tendered - cartSubtotal);

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    if (paymentMethod === 'cash' && tendered < cartSubtotal) {
      toast.error('Cash amount is less than total');
      return;
    }
    setCheckingOut(true);
    try {
      const payload = {
        customer_id: selectedCustomerId ? Number(selectedCustomerId) : null,
        type: 'sale',
        payment_method: paymentMethod,
        payment_status: 'paid',
        paid_at: new Date().toISOString(),
        items: cartItems.map((item) => ({
          product_id: item.product.id,
          description: item.product.name,
          quantity: item.quantity,
          unit_price: Number(item.product.unit_price),
          line_total: Number(item.product.unit_price) * item.quantity,
        })),
        notes: 'Walk-in retail purchase via POS',
      };
      await transactionsApi.create(payload);
      toast.success('Checkout completed successfully');
      setCartItems([]);
      setCartOpen(false);
      setSelectedCustomerId('');
      setAmountTendered('');
      fetchProducts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Checkout failed');
    } finally {
      setCheckingOut(false);
    }
  };

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '12', status: 'active' };
      if (categoryFilter) params.product_category_id = categoryFilter;
      if (search) params.search = search;
      const { data } = await productsApi.list(params);
      setProducts(data.data?.products || data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, search]);

  const fetchCategories = useCallback(async () => {
    try {
      const { data } = await productsApi.listCategories();
      setCategories(data.data || []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);
  useEffect(() => { setPage(1); }, [categoryFilter, search]);

  const isLowStock = (p: Product) => Number(p.current_stock) <= Number(p.minimum_stock);

  const getCategoryName = (p: Product) => {
    if (p.category && typeof p.category === 'object') return p.category.name;
    return String(p.category || '—');
  };

  const formatPrice = (price: number | string) => `₱${Number(price).toLocaleString()}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-neutral-900">Products</h1>
          <p className="text-sm text-neutral-500 mt-1">Browse products and process walk-in retail sales</p>
        </div>
        <button
          onClick={() => setCartOpen(true)}
          className="btn-secondary relative flex items-center gap-2"
        >
          <ShoppingCart size={18} />
          Cart
          {cartItems.length > 0 && (
            <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Filters */}
      <div className="card pb-0">
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="input-field pl-10"
            />
          </div>
          <select className="select-field w-full sm:w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Product grid */}
      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : products.length === 0 ? (
        <EmptyState title="No products found" description="Adjust your filters or search terms." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map((p) => {
            const low = isLowStock(p);
            const outOfStock = Number(p.current_stock) <= 0;
            return (
              <div key={p.id} className="card p-4 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-neutral-900 truncate">{p.name}</p>
                    <p className="text-[11px] text-neutral-500 capitalize">{getCategoryName(p)}</p>
                  </div>
                  {low && <AlertTriangle size={16} className="text-red-500 shrink-0" />}
                </div>

                <div className="flex items-end justify-between gap-2">
                  <div>
                    <p className="text-lg font-semibold text-neutral-900">{formatPrice(p.unit_price)}</p>
                    <p className="text-xs text-neutral-500">
                      Stock: <span className={low ? 'font-medium text-red-600' : 'font-medium text-neutral-900'}>{Number(p.current_stock)}</span> {p.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => addToCart(p)}
                    disabled={outOfStock || Number(p.unit_price) <= 0}
                    title={outOfStock ? 'Out of stock' : 'Add to Cart'}
                    className="btn-primary !py-2 !px-3 text-xs flex items-center gap-1.5"
                  >
                    <ShoppingCart size={16} />
                    Add
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && products.length > 0 && (
        <div className="flex justify-center">
          <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
        </div>
      )}

      {/* POS Cart Drawer */}
      <Drawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
        title="Retail POS Cart"
        subtitle="Process walk-in or in-store product purchases"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <div>
            <label className="label">Customer (Optional)</label>
            <select
              className="select-field text-sm"
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
            >
              <option value="">Walk-in Customer</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.first_name} {c.last_name} ({c.user?.email || c.user?.phone || 'No contact'})</option>
              ))}
            </select>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-2">Cart Items ({cartItems.length})</p>
            {cartItems.length === 0 ? (
              <div className="card p-6 text-center bg-neutral-50 text-neutral-500 text-sm">
                Your cart is empty. Click <span className="font-semibold text-neutral-900">Add to Cart</span> on any product.
              </div>
            ) : (
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {cartItems.map((item) => (
                  <div key={item.product.id} className="card p-3 flex items-center justify-between gap-3 bg-white">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-neutral-900 truncate">{item.product.name}</p>
                      <p className="text-[11px] text-neutral-500">₱{Number(item.product.unit_price).toLocaleString()} each</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center border border-neutral-300 rounded-md">
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                          className="px-2 py-0.5 text-neutral-600 hover:bg-neutral-100 transition"
                        >
                          -
                        </button>
                        <span className="px-2.5 text-xs font-medium text-neutral-900">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                          className="px-2 py-0.5 text-neutral-600 hover:bg-neutral-100 transition"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateCartQty(item.product.id, 0)}
                        className="text-neutral-400 hover:text-red-600 p-1 transition"
                        title="Remove item"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {cartItems.length > 0 && (
            <div className="space-y-4 border-t border-neutral-200 pt-4">
              <div className="flex justify-between font-semibold text-neutral-900 text-base border-t border-neutral-200 pt-2">
                <span>Total Amount</span>
                <span>₱{cartSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div>
                <label className="label">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'cash', label: 'Cash' },
                    { value: 'gcash', label: 'GCash' },
                    { value: 'gotyme', label: 'GoTyme' },
                    { value: 'rcbc', label: 'RCBC' },
                  ].map((pm) => (
                    <button
                      key={pm.value}
                      type="button"
                      onClick={() => setPaymentMethod(pm.value)}
                      className={`p-2 rounded-md border text-xs font-medium transition ${
                        paymentMethod === pm.value
                          ? 'border-neutral-900 bg-neutral-900 text-white'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
                      }`}
                    >
                      {pm.label}
                    </button>
                  ))}
                </div>
              </div>

              {paymentMethod === 'cash' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Cash Amount</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      className="input-field hide-number-spinners"
                      placeholder="0.00"
                      value={amountTendered}
                      onChange={(e) => setAmountTendered(formatAmountInput(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="label">Change</label>
                    <div className="input-field bg-neutral-50 text-neutral-700 flex items-center font-medium">
                      ₱{change.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleCheckout}
                disabled={checkingOut || cartItems.length === 0}
                className="btn-primary w-full !py-3 text-sm flex items-center justify-center gap-2"
              >
                {checkingOut ? <LoadingSpinner /> : <span className="font-semibold">₱</span>}
                Checkout
              </button>
            </div>
          )}
        </div>
      </Drawer>
    </div>
  );
}