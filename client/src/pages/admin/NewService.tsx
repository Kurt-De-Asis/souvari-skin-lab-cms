import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { X, Save, Package, Plug, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { servicesApi, serviceCategoriesApi, resourcesApi, serviceAddonsApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { registerMoney } from '@/utils/money';
import { formatAmountInput, parseAmountInput } from '@/utils/format';

interface ServiceForm {
  name: string;
  description: string;
  category: string;
  category_id: number | null;
  service_type: string;
  pricing_type: string;
  price: number;
  duration_minutes: number;
  status: string;
}

interface Resource {
  id: number;
  name: string;
  type: string;
  is_active: boolean;
}

interface ServiceAddon {
  name: string;
  description: string;
  price: number;
  additional_duration_minutes: number;
}

type Tab = 'basic' | 'resources' | 'addons';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'basic', label: 'Basic Details', icon: null },
  { key: 'resources', label: 'Resources', icon: Package },
  { key: 'addons', label: 'Service Add-ons', icon: Plug },
];

const SERVICE_TYPES = ['Individual', 'Group', 'Private', 'Walk-in', 'Appointment', 'Event', 'Training', 'Other'];
const PRICING_TYPES = ['fixed', 'starting_at', 'variable', 'free'];

export default function NewService() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [activeTab, setActiveTab] = useState<Tab>('basic');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [allResources, setAllResources] = useState<Resource[]>([]);
  const [assignedResourceIds, setAssignedResourceIds] = useState<number[]>([]);
  const [addons, setAddons] = useState<ServiceAddon[]>([]);

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<ServiceForm>({
    defaultValues: {
      name: '',
      description: '',
      category: '',
      category_id: null,
      service_type: 'Individual',
      pricing_type: 'fixed',
      price: 0,
      duration_minutes: 30,
      status: 'active',
    },
  });

  const serviceName = watch('name');

  useEffect(() => {
    loadBaseData();
    if (isEdit) loadServiceData();
  }, [id]);

  const loadBaseData = async () => {
    try {
      const catRes = await serviceCategoriesApi.list({ limit: '100' });
      setCategories(catRes.data.data?.data || catRes.data.data || []);
    } catch {}
    try {
      const resRes = await resourcesApi.list({ limit: '100', is_active: 'true' });
      setAllResources(resRes.data.data?.data || resRes.data.data || []);
    } catch {}
  };

  const loadServiceData = async () => {
    setLoading(true);
    try {
      const { data } = await servicesApi.getById(Number(id));
      const svc = data.data || data;
      reset({
        name: svc.name || '',
        description: svc.description || '',
        category: svc.category || '',
        category_id: svc.category_id || null,
        service_type: svc.service_type || 'Individual',
        pricing_type: svc.pricing_type || 'fixed',
        price: svc.price || 0,
        duration_minutes: svc.duration_minutes || 30,
        status: svc.status || 'active',
      });

      // Load allocated resources
      try {
        const resRes = await resourcesApi.getServiceResources(Number(id));
        setAssignedResourceIds((resRes.data.data || []).map((r: any) => r.resource_id));
      } catch {}

      // Load addons
      try {
        const addonRes = await serviceAddonsApi.list({ service_id: String(id) });
        const addonData = addonRes.data.data || [];
        setAddons(addonData.map((a: any) => ({
          name: a.name,
          description: a.description || '',
          price: a.price || 0,
          additional_duration_minutes: a.additional_duration_minutes || 0,
        })));
      } catch {}
    } catch {
      toast.error('Failed to load service');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: ServiceForm) => {
    setSaving(true);
    try {
      let serviceId: number;
      const payload = {
        ...values,
        price: Number(values.price),
        duration_minutes: Number(values.duration_minutes),
        category_id: values.category_id ? Number(values.category_id) : null,
      };

      if (isEdit) {
        await servicesApi.update(Number(id), payload);
        serviceId = Number(id);
        toast.success('Service updated');
      } else {
        const { data } = await servicesApi.create(payload);
        serviceId = data.data?.id || data.id;
        toast.success('Service created');
      }

      // Save resource assignments
      await resourcesApi.assignToService(serviceId, { resource_ids: assignedResourceIds });
      // Save addons
      const existingAddons = await serviceAddonsApi.list({ service_id: String(serviceId) });
      for (const existing of (existingAddons.data.data || [])) {
        await serviceAddonsApi.remove(existing.id);
      }
      for (const addon of addons) {
        if (addon.name.trim()) {
          await serviceAddonsApi.create({ ...addon, service_id: serviceId });
        }
      }

      navigate('/admin/services');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save service');
    } finally {
      setSaving(false);
    }
  };

  const toggleResource = (resourceId: number) => {
    setAssignedResourceIds(prev => prev.includes(resourceId) ? prev.filter(id => id !== resourceId) : [...prev, resourceId]);
  };

  const addAddon = () => {
    setAddons(prev => [...prev, { name: '', description: '', price: 0, additional_duration_minutes: 0 }]);
  };

  const updateAddon = (index: number, field: keyof ServiceAddon, value: any) => {
    setAddons(prev => prev.map((a, i) => i === index ? { ...a, [field]: value } : a));
  };

  const removeAddon = (index: number) => {
    setAddons(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={() => navigate('/admin/services')} className="p-2 hover:bg-neutral-100 rounded-md transition flex-shrink-0">
            <ArrowLeft size={20} className="text-neutral-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-sans font-semibold text-neutral-900">{isEdit ? 'Edit Service' : 'New Service'}</h1>
            {serviceName && <p className="text-sm text-neutral-500 mt-0.5 truncate">{serviceName}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/services')} className="btn-secondary flex-1 sm:flex-none justify-center">
            <X size={16} /> Cancel
          </button>
          <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-primary flex-1 sm:flex-none justify-center">
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <div className="w-full lg:w-56 lg:flex-shrink-0">
          <nav className="flex lg:flex-col space-x-1 lg:space-x-0 space-y-0 lg:space-y-1 overflow-x-auto pb-1 lg:pb-0">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`w-full lg:w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-neutral-900 text-white'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {tab.icon && <tab.icon size={16} />}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit(onSubmit)}>
            {activeTab === 'basic' && (
              <div className="card space-y-6">
                <h2 className="text-lg font-semibold text-neutral-900">Basic Details</h2>

                <div>
                  <label className="label">Service Name *</label>
                  <div className="relative">
                    <input
                      className="input-field"
                      placeholder="Enter service name"
                      maxLength={255}
                      {...register('name', { required: 'Service name is required', maxLength: { value: 255, message: 'Max 255 characters' } })}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                      {(serviceName || '').length}/255
                    </span>
                  </div>
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Category</label>
                    <select className="select-field" {...register('category_id')}>
                      <option value="">Select category</option>
                      {categories.map((cat: any) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Service Type</label>
                    <select className="select-field" {...register('service_type')}>
                      {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Description</label>
                  <textarea
                    className="input-field min-h-[100px]"
                    placeholder="Describe the service..."
                    {...register('description')}
                  />
                </div>

                <div className="border-t border-neutral-200 pt-6">
                  <h3 className="text-md font-semibold text-neutral-900 mb-4">Pricing & Duration</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="label">Price Type</label>
                      <select className="select-field" {...register('pricing_type')}>
                        {PRICING_TYPES.map(t => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label">Price (₱)</label>
                      <input type="text" inputMode="decimal" className="input-field hide-number-spinners" {...registerMoney(register, 'price', { min: { value: 0, message: 'Price cannot be negative' } })} />
                      {errors.price && <p className="text-xs text-red-600 mt-1">{errors.price.message}</p>}
                    </div>
                    <div>
                      <label className="label">Duration (minutes)</label>
                      <input type="number" min="1" className="input-field" {...register('duration_minutes', { min: { value: 1, message: 'Must be > 0' } })} />
                      {errors.duration_minutes && <p className="text-xs text-red-600 mt-1">{errors.duration_minutes.message}</p>}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="label">Status</label>
                  <select className="select-field w-full sm:w-auto" {...register('status')}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>
            )}

            {activeTab === 'resources' && (
              <div className="card space-y-4">
                <h2 className="text-lg font-semibold text-neutral-900">Resources</h2>
                <p className="text-sm text-neutral-500">Assign resources required for this service.</p>
                <div className="space-y-2">
                  {allResources.length === 0 ? (
                    <p className="text-sm text-neutral-400 text-center py-8">No active resources</p>
                  ) : (
                    allResources.map(resource => (
                      <label key={resource.id} className="flex items-center gap-3 p-3 rounded-md border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignedResourceIds.includes(resource.id)}
                          onChange={() => toggleResource(resource.id)}
                          className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div>
                          <span className="text-sm font-medium text-neutral-700">{resource.name}</span>
                          <span className="text-xs text-neutral-500 ml-2 capitalize">({resource.type})</span>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'addons' && (
              <div className="card space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-neutral-900">Service Add-ons</h2>
                    <p className="text-sm text-neutral-500 mt-0.5">Optional extras customers can add to this service.</p>
                  </div>
                  <button type="button" onClick={addAddon} className="btn-secondary text-sm">
                    + Add Add-on
                  </button>
                </div>
                {addons.length === 0 ? (
                  <p className="text-sm text-neutral-400 text-center py-8">No add-ons yet. Click "Add Add-on" to create one.</p>
                ) : (
                  <div className="space-y-4">
                    {addons.map((addon, idx) => (
                      <div key={idx} className="border border-neutral-200 rounded-md p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-neutral-700">Add-on #{idx + 1}</span>
                          <button type="button" onClick={() => removeAddon(idx)} className="text-red-500 hover:text-red-700 text-sm">Remove</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="label">Name</label>
                            <input className="input-field" placeholder="Add-on name" value={addon.name} onChange={e => updateAddon(idx, 'name', e.target.value)} />
                          </div>
                          <div>
                            <label className="label">Price (₱)</label>
                            <input type="text" inputMode="decimal" className="input-field hide-number-spinners" value={addon.price ? formatAmountInput(String(addon.price)) : ''} onChange={e => updateAddon(idx, 'price', parseAmountInput(e.target.value) || 0)} />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="label">Description</label>
                            <input className="input-field" placeholder="Brief description" value={addon.description} onChange={e => updateAddon(idx, 'description', e.target.value)} />
                          </div>
                          <div>
                            <label className="label">Extra Duration (min)</label>
                            <input type="number" min="0" className="input-field" value={addon.additional_duration_minutes} onChange={e => updateAddon(idx, 'additional_duration_minutes', Number(e.target.value))} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
