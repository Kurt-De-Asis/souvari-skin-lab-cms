import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { customersApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

interface Customer {
  id: number;
  first_name: string;
  last_name: string;
  gender: string;
  date_of_birth?: string;
  address?: string;
  user?: { id: number; email: string; phone: string; status: string };
}

interface CustomerForm {
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  phone: string;
  gender: string;
  date_of_birth?: string;
  address?: string;
}

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CustomerForm>();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { setPage(1); }, [debouncedSearch]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (debouncedSearch) params.search = debouncedSearch;
      const { data } = await customersApi.list(params);
      const result = data.data;
      setCustomers(result?.data || []);
      setTotalPages(result?.pagination?.totalPages || 1);
      setTotal(result?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openAddModal = () => {
    setEditingCustomer(null);
    reset({ first_name: '', last_name: '', email: '', password: '', phone: '', gender: 'male', date_of_birth: '', address: '' });
    setModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    reset({
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.user?.email || '',
      phone: c.user?.phone || '',
      gender: c.gender,
      date_of_birth: c.date_of_birth || '',
      address: c.address || '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (values: CustomerForm) => {
    setSubmitting(true);
    try {
      if (editingCustomer) {
        await customersApi.update(editingCustomer.id, values);
        toast.success('Customer updated');
      } else {
        await customersApi.create({ ...values, password: values.password || 'password123' });
        toast.success('Customer created');
      }
      setModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await customersApi.delete(deleteId);
      toast.success('Customer deleted');
      setDeleteId(null);
      fetchCustomers();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Customers</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage your customer base</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <Plus size={18} />
          Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="card pb-0">
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="input-field pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : customers.length === 0 ? (
          <EmptyState title="No customers found" description="Try adjusting your search or add a new customer." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 font-medium">Name</th>
                  <th className="px-6 py-3 font-medium">Email</th>
                  <th className="px-6 py-3 font-medium">Phone</th>
                  <th className="px-6 py-3 font-medium">Gender</th>
                  <th className="px-6 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/50">
                    <td className="px-6 py-4 font-medium text-neutral-900">
                      {c.first_name} {c.last_name}
                    </td>
                    <td className="px-6 py-4 text-neutral-600">{c.user?.email || '—'}</td>
                    <td className="px-6 py-4 text-neutral-600">{c.user?.phone || '—'}</td>
                    <td className="px-6 py-4 text-neutral-600 capitalize">{c.gender || '—'}</td>
                    <td className="px-6 py-4"><StatusBadge status={c.user?.status || 'active'} /></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEditModal(c)} className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => setDeleteId(c.id)} className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
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
        {!loading && customers.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingCustomer ? 'Edit Customer' : 'Add Customer'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input className="input-field" placeholder="First name" {...register('first_name', { required: 'Required' })} />
              {errors.first_name && <p className="text-xs text-red-600 mt-1">{errors.first_name.message}</p>}
            </div>
            <div>
              <label className="label">Last Name</label>
              <input className="input-field" placeholder="Last name" {...register('last_name', { required: 'Required' })} />
              {errors.last_name && <p className="text-xs text-red-600 mt-1">{errors.last_name.message}</p>}
            </div>
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input-field" placeholder="email@example.com" {...register('email', { required: 'Required' })} />
            {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
          </div>
          {!editingCustomer && (
            <div>
              <label className="label">Password</label>
              <input type="password" className="input-field" placeholder="Min. 8 characters" {...register('password', { required: 'Required', minLength: { value: 8, message: 'Must be at least 8 characters' } })} />
              {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input-field" placeholder="Phone number" {...register('phone')} />
            </div>
            <div>
              <label className="label">Gender</label>
              <select className="select-field" {...register('gender')}>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Date of Birth</label>
            <input type="date" className="input-field" {...register('date_of_birth')} />
          </div>
          <div>
            <label className="label">Address</label>
            <input className="input-field" placeholder="Address" {...register('address')} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editingCustomer ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Delete Customer" maxWidth="max-w-sm">
        <p className="text-sm text-neutral-600 mb-6">
          Are you sure you want to delete this customer? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <button onClick={() => setDeleteId(null)} className="btn-secondary">Cancel</button>
          <button onClick={handleDelete} className="btn-danger">Delete</button>
        </div>
      </Modal>
    </div>
  );
}
