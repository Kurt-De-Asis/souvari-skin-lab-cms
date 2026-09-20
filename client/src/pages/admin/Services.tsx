import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Pencil, Users, Package, Scissors } from 'lucide-react';
import toast from 'react-hot-toast';
import { servicesApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';

interface Service {
  id: number;
  name: string;
  category: string;
  price: number;
  duration_minutes: number;
  status: string;
  description?: string;
  service_type?: string;
}

const CATEGORIES = [
  { value: '', label: 'All Categories' },
  { value: 'facial', label: 'Facial' },
  { value: 'body', label: 'Body' },
  { value: 'hair_removal', label: 'Hair Removal' },
  { value: 'skin_rejuvenation', label: 'Skin Rejuvenation' },
  { value: 'injection', label: 'Injection' },
  { value: 'laser', label: 'Laser' },
  { value: 'consultation', label: 'Consultation' },
  { value: 'package', label: 'Package' },
  { value: 'other', label: 'Other' },
];

export default function Services() {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
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
      if (categoryFilter) params.category = categoryFilter;
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

  const formatPrice = (price: number) => `₱${Number(price).toLocaleString()}`;

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
          <select className="select-field w-auto" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select className="select-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
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
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Category</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Price</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Duration</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {services.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 font-medium text-neutral-900">{s.name}</td>
                    <td className="px-6 py-4 text-neutral-600 capitalize">{s.category?.replace('_', ' ')}</td>
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
