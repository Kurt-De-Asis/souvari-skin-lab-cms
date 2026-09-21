import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { Search, Plus, Pencil, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import { staffApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

interface Staff {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  job_title?: string;
  permission_level?: string;
  status: string;
  schedules?: any[];
}

interface StaffForm {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  position: string;
  job_title?: string;
  permission_level?: string;
  password?: string;
}

interface Schedule {
  day_of_week: string;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
}

const WEEK_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;
const WEEK: { key: string; label: string }[] = [
  { key: 'sunday', label: 'Sunday' },
  { key: 'monday', label: 'Monday' },
  { key: 'tuesday', label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday', label: 'Thursday' },
  { key: 'friday', label: 'Friday' },
  { key: 'saturday', label: 'Saturday' },
];

export default function Staff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [positionFilter, setPositionFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Schedule modal
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleStaff, setScheduleStaff] = useState<Staff | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<StaffForm>();

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '10' };
      if (positionFilter) params.position = positionFilter;
      if (statusFilter) params.status = statusFilter;
      const { data } = await staffApi.list(params);
      setStaff(data.data?.staff || data.data?.data || []);
      setTotalPages(data.data?.totalPages || data.data?.pagination?.totalPages || 1);
      setTotal(data.data?.total || data.data?.pagination?.total || 0);
    } catch {
      toast.error('Failed to load staff');
    } finally {
      setLoading(false);
    }
  }, [page, positionFilter, statusFilter]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);
  useEffect(() => { setPage(1); }, [positionFilter, statusFilter]);

  const openAddModal = () => {
    setEditingStaff(null);
    reset({ first_name: '', last_name: '', email: '', phone: '', position: '', job_title: '', permission_level: 'medium', password: '' });
    setModalOpen(true);
  };

  const openEditModal = (s: Staff) => {
    setEditingStaff(s);
    reset({ first_name: s.first_name, last_name: s.last_name, email: s.email, phone: s.phone, position: s.position, job_title: s.job_title || '', permission_level: s.permission_level || 'medium', password: '' });
    setModalOpen(true);
  };

  const onSubmit = async (values: StaffForm) => {
    setSubmitting(true);
    try {
      const payload = { ...values };
      if (editingStaff && !payload.password) delete payload.password;
      if (editingStaff) {
        await staffApi.update(editingStaff.id, payload);
        toast.success('Staff updated');
      } else {
        await staffApi.create(payload);
        toast.success('Staff created');
      }
      setModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const openScheduleModal = async (s: Staff) => {
    setScheduleStaff(s);
    setScheduleModalOpen(true);
    setScheduleLoading(true);
    try {
      const { data } = await staffApi.getSchedules(s.id);
      const rows = data.data?.schedules || data.data || [];
      const normalized = WEEK_ORDER.map((d) => {
        const existing = (rows || []).find((r: any) => r.day_of_week === d);
        if (existing) {
          return {
            day_of_week: existing.day_of_week,
            start_time: existing.start_time,
            end_time: existing.end_time,
            break_start: existing.break_start ?? null,
            break_end: existing.break_end ?? null,
          };
        }
        return { day_of_week: d, start_time: '00:00', end_time: '00:00', break_start: null, break_end: null };
      });
      setSchedules(normalized);
    } catch {
      toast.error('Failed to load schedule');
      setSchedules(WEEK_ORDER.map((d) => ({ day_of_week: d, start_time: '00:00', end_time: '00:00', break_start: null, break_end: null })));
    } finally {
      setScheduleLoading(false);
    }
  };

  const toggleWorkingDay = (dayOfWeek: string, working: boolean) => {
    setSchedules((prev) =>
      prev.map((s) => {
        if (s.day_of_week !== dayOfWeek) return s;
        if (working) {
          const isCurrentlyOff = s.start_time === '00:00' && s.end_time === '00:00';
          return {
            ...s,
            start_time: isCurrentlyOff ? '09:00' : s.start_time,
            end_time: isCurrentlyOff ? '18:00' : s.end_time,
            break_start: null,
            break_end: null,
          };
        }
        return { ...s, start_time: '00:00', end_time: '00:00', break_start: null, break_end: null };
      })
    );
  };

  const updateScheduleDay = (dayOfWeek: string, field: keyof Schedule, value: any) => {
    setSchedules((prev) =>
      prev.map((s) => (s.day_of_week === dayOfWeek ? { ...s, [field]: value } : s))
    );
  };

  const saveSchedules = async () => {
    if (!scheduleStaff) return;
    setScheduleSaving(true);
    try {
      const payload = WEEK_ORDER.map((d) => {
        const s = schedules.find((x) => x.day_of_week === d);
        const isOff = !s || (s.start_time === '00:00' && s.end_time === '00:00');
        return isOff
          ? { day_of_week: d, start_time: '00:00', end_time: '00:00', break_start: null, break_end: null, is_active: true }
          : { day_of_week: d, start_time: s!.start_time, end_time: s!.end_time, break_start: s!.break_start || null, break_end: s!.break_end || null, is_active: true };
      });
      await staffApi.updateSchedules(scheduleStaff.id, { schedules: payload });
      toast.success('Schedule updated');
      setScheduleModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save schedule');
    } finally {
      setScheduleSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-neutral-900">Team Members</h1>
          <p className="text-sm text-neutral-500 mt-1">Manage team members and their weekly schedules</p>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <Plus size={18} />
          Add Staff
        </button>
      </div>

      {/* Filters */}
      <div className="card pb-0">
        <div className="flex flex-wrap gap-3 pb-4">
          <select className="select-field w-auto" value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
            <option value="">All Positions</option>
            <option value="head_admin">Head/Admin</option>
            <option value="nail_technician">Nail Technician</option>
            <option value="facialist">Facialist</option>
            <option value="nail_and_skin_care_specialist">Nail and Skin Care Specialist</option>
            <option value="clinic_head_nurse">Clinic Head Nurse</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="therapist">Therapist</option>
            <option value="aesthetician">Aesthetician</option>
            <option value="receptionist">Receptionist</option>
          </select>
          <select className="select-field w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on_leave">On Leave</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        {loading ? (
          <LoadingSpinner fullScreen={false} />
        ) : staff.length === 0 ? (
          <EmptyState title="No staff found" description="Adjust filters or add a new staff member." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Name</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Job Title</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Permission</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Hours/Week</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {staff.map((s) => {
                  const initials = `${s.first_name?.[0] || ''}${s.last_name?.[0] || ''}`.toUpperCase();
                  const workingDays = (s.schedules || []).filter((sc: any) => sc.is_active && (sc.start_time !== '00:00' || sc.end_time !== '00:00'));
                  const hoursPerWeek = workingDays.reduce((sum: number, sc: any) => {
                    const start = parseInt(sc.start_time?.split(':')[0] || '0');
                    const end = parseInt(sc.end_time?.split(':')[0] || '0');
                    return sum + (end > start ? end - start : 0);
                  }, 0);
                  return (
                    <tr key={s.id} className="hover:bg-neutral-50/50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {initials}
                          </div>
                          <div>
                            <div className="font-medium text-neutral-900">{s.first_name} {s.last_name}</div>
                            <div className="text-xs text-neutral-500">{s.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-600 text-sm">{s.job_title || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
                          s.permission_level === 'owner' ? 'bg-neutral-900 text-white' :
                          s.permission_level === 'high' ? 'bg-neutral-700 text-white' :
                          'bg-neutral-100 text-neutral-700'
                        }`}>
                          {s.permission_level || 'medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-neutral-600">{hoursPerWeek}h</td>
                      <td className="px-6 py-4"><StatusBadge status={s.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEditModal(s)} title="Edit" className="p-2 text-neutral-500 hover:text-primary-600 hover:bg-primary-50 rounded-md transition">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => openScheduleModal(s)} title="Schedule" className="p-2 text-neutral-500 hover:text-primary-700 hover:bg-blue-50 rounded-md transition">
                            <Calendar size={16} />
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
        {!loading && staff.length > 0 && (
          <div className="px-6 pb-4">
            <Pagination page={page} totalPages={totalPages} total={total} onPageChange={setPage} />
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingStaff ? 'Edit Staff' : 'Add Staff'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Phone</label>
              <input className="input-field" placeholder="Phone number" {...register('phone', { required: 'Required' })} />
              {errors.phone && <p className="text-xs text-red-600 mt-1">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="label">Position</label>
<select className="select-field" {...register('position', { required: 'Required' })}>
            <option value="">Select position</option>
            <option value="head_admin">Head/Admin</option>
            <option value="nail_technician">Nail Technician</option>
            <option value="facialist">Facialist</option>
            <option value="nail_and_skin_care_specialist">Nail and Skin Care Specialist</option>
            <option value="clinic_head_nurse">Clinic Head Nurse</option>
            <option value="doctor">Doctor</option>
            <option value="nurse">Nurse</option>
            <option value="therapist">Therapist</option>
            <option value="aesthetician">Aesthetician</option>
            <option value="receptionist">Receptionist</option>
            <option value="manager">Manager</option>
          </select>
              {errors.position && <p className="text-xs text-red-600 mt-1">{errors.position.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Job Title</label>
              <input className="input-field" placeholder="e.g. Skincare Specialist" {...register('job_title')} />
            </div>
            <div>
              <label className="label">Permission Level</label>
              <select className="select-field" {...register('permission_level')}>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="owner">Owner</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">{editingStaff ? 'Password (leave blank to keep)' : 'Password'}</label>
            <input type="password" className="input-field" placeholder="••••••••" {...register('password', editingStaff ? {} : { required: 'Required' })} />
            {errors.password && <p className="text-xs text-red-600 mt-1">{errors.password.message}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={submitting} className="btn-primary">
              {submitting ? 'Saving...' : editingStaff ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Schedule Modal */}
      <Modal open={scheduleModalOpen} onClose={() => setScheduleModalOpen(false)} title={`Schedule — ${scheduleStaff?.first_name} ${scheduleStaff?.last_name}`} maxWidth="max-w-2xl">
        {scheduleLoading ? (
          <LoadingSpinner />
        ) : (
          <div className="space-y-3">
            <div className="text-xs text-neutral-500 mb-2">Set working hours for each day of the week. Break times are optional.</div>
            {WEEK.map((day) => {
              const daySchedule = schedules.find((s) => s.day_of_week === day.key);
              const isOff = !daySchedule || (daySchedule.start_time === '00:00' && daySchedule.end_time === '00:00');
              return (
                <div key={day.key} className="p-3 rounded-md bg-neutral-50">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <span className="w-full sm:w-28 text-sm font-medium text-neutral-700">{day.label}</span>
                    <label className="flex items-center gap-2 text-sm text-neutral-600">
                      <input
                        type="checkbox"
                        checked={!isOff}
                        onChange={(e) => toggleWorkingDay(day.key, e.target.checked)}
                        className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      Working
                    </label>
                    {!isOff && (
                      <div className="flex items-center gap-2 ml-auto">
                        <input
                          type="time"
                          value={daySchedule!.start_time}
                          onChange={(e) => updateScheduleDay(day.key, 'start_time', e.target.value)}
                          className="input-field w-auto"
                        />
                        <span className="text-neutral-400">—</span>
                        <input
                          type="time"
                          value={daySchedule!.end_time}
                          onChange={(e) => updateScheduleDay(day.key, 'end_time', e.target.value)}
                          className="input-field w-auto"
                        />
                      </div>
                    )}
                  </div>
                  {!isOff && (
                    <div className="flex items-center gap-3 mt-2 ml-[7.5rem] sm:ml-[8.5rem]">
                      <span className="text-xs text-neutral-500 whitespace-nowrap">Break:</span>
                      <input
                        type="time"
                        value={daySchedule!.break_start || ''}
                        onChange={(e) => updateScheduleDay(day.key, 'break_start', e.target.value || null)}
                        className="input-field w-auto text-xs"
                      />
                      <span className="text-neutral-400">—</span>
                      <input
                        type="time"
                        value={daySchedule!.break_end || ''}
                        onChange={(e) => updateScheduleDay(day.key, 'break_end', e.target.value || null)}
                        className="input-field w-auto text-xs"
                      />
                    </div>
                  )}
                </div>
              );
            })}
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setScheduleModalOpen(false)} className="btn-secondary">Cancel</button>
              <button onClick={saveSchedules} disabled={scheduleSaving} className="btn-primary">
                {scheduleSaving ? 'Saving...' : 'Save Schedule'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
