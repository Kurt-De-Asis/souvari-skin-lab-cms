import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Users, Package, Scissors } from 'lucide-react';
import toast from 'react-hot-toast';
import { servicesApi, serviceCategoriesApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import { formatServicePrice } from '@/utils/format';
import formatCategory from '@/utils/formatCategory';

interface Service {
  id: number;
  name: string;
  category: string;
  category_id: number | null;
  category_name?: string;
  price: number;
  duration_minutes: number;
  status: string;
  description?: string;
  service_type?: string;
}

interface CategoryOption {
  id: number;
  name: string;
}

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (categoryFilter) params.category_id = categoryFilter;
      if (statusFilter) params.status = statusFilter;
      if (search) params.search = search;
      const { data } = await servicesApi.list(params);
      setServices(data.data?.services || data.data?.data || []);
      setTotalPages(data.data?.totalPages || data.data?.pagination?.totalPages || 1);
      setTotal(data.data?.total || data.data?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, statusFilter, search]);

  useEffect(() => { fetchServices(); }, [fetchServices]);
  useEffect(() => { setPage(1); }, [categoryFilter, statusFilter, search]);

  useEffect(() => {
    (async () => {
      try {
        const catRes = await serviceCategoriesApi.browse({ limit: '100' });
        setCategories((catRes.data.data?.data || catRes.data.data || []).map((c: any) => ({ id: c.id, name: c.name })));
      } catch {}
    })();
  }, []);

  const handleArchive = async (service: Service) => {
    if (!confirm(`Archive "${service.name}"?`)) return;
    try {
      await servicesApi.update(service.id, { status: 'inactive', is_active: false });
      toast.success('Service archived');
      fetchServices();
    } catch {
      toast.error('Failed to archive service');
    }
  };

  const formatPrice = (price: number) => formatServicePrice(price);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-neutral-900">Services</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your service offerings</p>
        </div>
        <button onClick={() => navigate('/admin/services/new')} className="btn-primary">
          <Plus size={18} />
          Add Service
        </button>
      </div>

      {/* Filters */}
      <div className="card pb-0">
        <div className="flex flex-wrap gap-3 pb-4">
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field w-64"
          />
          <select className="select-field w-full sm:w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
          </select>
          <select className="select-field w-full sm:w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : services.length === 0 ? (
          <EmptyState title="No services found" description="Adjust filters or add a new service." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[760px]">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Category</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Price</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Duration</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 font-medium text-neutral-900">{s.name}</td>
                    <td className="px-6 py-4 text-neutral-600">{formatCategory(s.category_name || s.category || 'other')}</td>
                    <td className="px-6 py-4 text-neutral-600 text-sm">{s.service_type || '—'}</td>
                    <td className="px-6 py-4 text-neutral-900 font-medium">{formatPrice(s.price)}</td>
                    <td className="px-6 py-4 text-neutral-600">{s.duration_minutes} min</td>
                    <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/admin/services/${s.id}/edit`)}
                          title="Edit"
                          className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition"
                        >
                          <Pencil size={16} />
                        </button>
                        {s.status === 'active' && (
                          <button
                            onClick={() => handleArchive(s)}
                            title="Archive"
                            className="p-2 text-neutral-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition text-xs"
                          >
                            Archive
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && services.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>
    </div>
  );
}
