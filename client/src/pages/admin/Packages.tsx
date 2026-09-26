import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import { servicePackagesApi, servicesApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Modal from '@/components/ui/Modal';
import { registerMoney } from '@/utils/money';

interface ServiceOption {
  id: number;
  name: string;
}

interface ServicePackage {
  id: number;
  service_id: number;
  sessions_included: number;
  session_price: number;
  ten_session_price?: number | null;
  inclusions?: string[] | null;
  savings_note?: string | null;
  service?: {
    name: string;
    category: string;
  };
}

interface PackageForm {
  service_id: number;
  sessions_included: number;
  session_price: number;
  ten_session_price?: number | null;
  inclusions?: string;
  savings_note?: string;
}

export default function Packages() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<ServicePackage | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [serviceOptions, setServiceOptions] = useState<ServiceOption[]>([]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<PackageForm>();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const fetchPackages = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await servicePackagesApi.list(params);
      const result = data.data;
      setPackages(result?.data || result?.packages || []);
      setTotalPages(result?.pagination?.totalPages || result?.totalPages || 1);
      setTotal(result?.pagination?.total || result?.total || 0);
    } catch {
      toast.error('Failed to load packages');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchPackages(); }, [fetchPackages]);

  const openAddModal = async () => {
    setEditingPackage(null);
    reset({ service_id: undefined as unknown as number, sessions_included: 1, session_price: 0, ten_session_price: undefined, inclusions: '', savings_note: '' });
    setModalOpen(true);
    try {
      const { data } = await servicesApi.list({ limit: '100' });
      setServiceOptions(data.data?.services || data.data?.data || []);
    } catch {
      toast.error('Failed to load services');
    }
  };

  const openEditModal = async (p: ServicePackage) => {
    setEditingPackage(p);
    reset({
      service_id: p.service_id,
      sessions_included: p.sessions_included,
      session_price: p.session_price,
      ten_session_price: p.ten_session_price ?? undefined,
      inclusions: Array.isArray(p.inclusions) ? p.inclusions.join('\n') : (p.inclusions || ''),
      savings_note: p.savings_note || '',
    });
    setModalOpen(true);
    try {
      const { data } = await servicesApi.list({ limit: '100' });
      setServiceOptions(data.data?.services || data.data?.data || []);
    } catch {
      toast.error('Failed to load services');
    }
  };

  const onSubmit = async (values: PackageForm) => {
    setSubmitting(true);
    try {
      const payload = {
        ...values,
        ten_session_price: values.ten_session_price || null,
        inclusions: values.inclusions ? values.inclusions.split('\n').map((s) => s.trim()).filter(Boolean) : null,
        savings_note: values.savings_note || null,
      };
      if (editingPackage) {
        await servicePackagesApi.update(editingPackage.id, payload);
        toast.success('Package updated');
      } else {
        await servicePackagesApi.create(payload);
        toast.success('Package created');
      }
      setModalOpen(false);
      fetchPackages();
    } catch (err: any) {
      const detail = err?.response?.data?.errors
        ? `: ${err.response.data.errors.map((e: any) => `${e.field} ${e.message}`).join(', ')}`
        : '';
      toast.error((err?.response?.data?.message || 'Operation failed') + detail);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await servicePackagesApi.remove(deleteId);
      toast.success('Package deleted');
      setDeleteId(null);
      fetchPackages();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  const formatPrice = (price?: number | null) =>
    price != null ? `₱${Number(price).toLocaleString()}` : '—';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-neutral-900">Session Packages</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage per-service session packages and pricing</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <Plus size={18} />
          Add Package
        </button>
      </div>

      {/* Search */}
      <div className="card pb-0">
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Package size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search by service name..."
              className="input-field pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : packages.length === 0 ? (
          <EmptyState title="No packages found" description="Add a new session package or adjust your search." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[840px]">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Service Name</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Category</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Sessions Included</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">1-Session Price</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">10-Session Price</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Inclusions</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 whitespace-nowrap">Savings Note</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {packages.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 font-medium text-neutral-900">{p.service?.name || `Service #${p.service_id}`}</td>
                    <td className="px-6 py-4 text-neutral-600 capitalize">{p.service?.category || '—'}</td>
                    <td className="px-6 py-4 text-neutral-600">{p.sessions_included}</td>
                    <td className="px-6 py-4 text-neutral-600">{formatPrice(p.session_price)}</td>
                    <td className="px-6 py-4 text-neutral-600">{formatPrice(p.ten_session_price)}</td>
                    <td className="px-6 py-4 text-neutral-600 max-w-[220px] truncate" title={Array.isArray(p.inclusions) ? p.inclusions.join(', ') : p.inclusions || ''}>{Array.isArray(p.inclusions) ? p.inclusions.join(', ') : p.inclusions || '—'}</td>
                    <td className="px-6 py-4 text-neutral-600 max-w-[180px] truncate" title={p.savings_note || ''}>{p.savings_note || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(p)} title="Edit" className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteId(p.id)} title="Delete" className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-md transition">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && packages.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingPackage ? 'Edit Package' : 'Add Package'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label">Service</label>
            <select className="select-field" {...register('service_id', { required: 'Required', valueAsNumber: true })}>
              <option value="">Select service</option>
              {serviceOptions.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            {errors.service_id && <p className="text-xs text-red-600 mt-1">{errors.service_id.message}</p>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Sessions Included</label>
              <input type="number" min="1" className="input-field" {...register('sessions_included', { required: 'Required', valueAsNumber: true, min: { value: 1, message: 'Min 1 session' } })} />
              {errors.sessions_included && <p className="text-xs text-red-600 mt-1">{errors.sessions_included.message}</p>}
            </div>
            <div>
              <label className="label">1-Session Price (₱)</label>
              <input type="text" inputMode="decimal" className="input-field hide-number-spinners" {...registerMoney(register, 'session_price', { required: 'Required' })} />
              {errors.session_price && <p className="text-xs text-red-600 mt-1">{errors.session_price.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">10-Session Price (₱)</label>
            <input type="text" inputMode="decimal" className="input-field hide-number-spinners" placeholder="Optional" {...registerMoney(register, 'ten_session_price')} />
          </div>
          <div>
            <label className="label">Inclusions</label>
            <textarea className="input-field" rows={3} placeholder="e.g. Free consultation, post-treatment kit" {...register('inclusions')} />
          </div>
          <div>
            <label className="label">Savings Note</label>
            <input className="input-field" placeholder="e.g. Save ₱1,500 vs single sessions" {...register('savings_note')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editingPackage ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Package" maxWidth="max-w-sm">
        <p className="text-sm text-neutral-600 mb-6">
          Are you sure you want to delete this package? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} className="btn-danger">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
