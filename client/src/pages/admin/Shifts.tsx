import { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Check, Coffee } from 'lucide-react';
import toast from 'react-hot-toast';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { staffApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';

dayjs.extend(isoWeek);

interface Schedule {
  day_of_week: string;
  start_time: string;
  end_time: string;
  break_start: string | null;
  break_end: string | null;
  is_active?: boolean;
}

interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string;
  status: string;
  schedules?: any[];
}

const WEEK_ORDER = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

const WEEK: { key: string; label: string; short: string }[] = [
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
];

const POSITIONS = [
  { value: '', label: 'All Positions' },
  { value: 'head_admin', label: 'Head/Admin' },
  { value: 'nail_technician', label: 'Nail Technician' },
  { value: 'facialist', label: 'Facialist' },
  { value: 'nail_and_skin_care_specialist', label: 'Nail and Skin Care Specialist' },
  { value: 'clinic_head_nurse', label: 'Clinic Head Nurse' },
  { value: 'doctor', label: 'Doctor' },
  { value: 'nurse', label: 'Nurse' },
  { value: 'therapist', label: 'Therapist' },
  { value: 'aesthetician', label: 'Aesthetician' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'manager', label: 'Manager' },
];

interface ShiftForm {
  staffId: number;
  dayOfWeek: string;
  working: boolean;
  start_time: string;
  end_time: string;
  break_start: string;
  break_end: string;
}

const formatTime = (time: string): string => {
  if (!time) return '';
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, '0')} ${period}`;
};

const isOffDay = (s?: Schedule): boolean =>
  !s || !s.is_active || (s.start_time === '00:00' && s.end_time === '00:00');

export default function Shifts() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [positionFilter, setPositionFilter] = useState('');
  const [currentDate, setCurrentDate] = useState(dayjs());

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<ShiftForm>({
    staffId: 0,
    dayOfWeek: 'monday',
    working: true,
    start_time: '09:00',
    end_time: '18:00',
    break_start: '',
    break_end: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: '1', limit: '100' };
      if (positionFilter) params.position = positionFilter;
      const { data } = await staffApi.list(params);
      setStaff(data.data?.staff || data.data?.data || []);
    } catch {
      toast.error('Failed to load staff');
      setStaff([]);
    } finally {
      setLoading(false);
    }
  }, [positionFilter]);

  useEffect(() => { fetchStaff(); }, [fetchStaff]);

  const weekStart = useMemo(() => currentDate.startOf('isoWeek'), [currentDate]);
  const weekRangeLabel = `${weekStart.format('MMM D')} - ${weekStart.add(6, 'day').format('MMM D, YYYY')}`;

  const navigate = (direction: 'prev' | 'next') => {
    setCurrentDate((prev) => (direction === 'prev' ? prev.subtract(1, 'week') : prev.add(1, 'week')));
  };

  const goToday = () => setCurrentDate(dayjs());

  const schedulesByStaff = useMemo(() => {
    const map = new Map<number, Schedule[]>();
    for (const s of staff) {
      const rows = WEEK_ORDER.map((d) => {
        const existing = ((s.schedules || []) as any[]).find((r) => r.day_of_week === d);
        if (existing) {
          return {
            day_of_week: existing.day_of_week,
            start_time: existing.start_time,
            end_time: existing.end_time,
            break_start: existing.break_start ?? null,
            break_end: existing.break_end ?? null,
            is_active: existing.is_active ?? true,
          };
        }
        return { day_of_week: d, start_time: '00:00', end_time: '00:00', break_start: null, break_end: null, is_active: true };
      });
      map.set(s.id, rows);
    }
    return map;
  }, [staff]);

  const activeStaff = useMemo(() => staff.filter((s) => s.status === 'active'), [staff]);

  const openAddModal = () => {
    setForm({ staffId: activeStaff[0]?.id || 0, dayOfWeek: 'monday', working: true, start_time: '09:00', end_time: '18:00', break_start: '', break_end: '' });
    setModalOpen(true);
  };

  const openEditModal = (s: StaffMember, dayOfWeek: string) => {
    const entry = schedulesByStaff.get(s.id)?.find((x) => x.day_of_week === dayOfWeek);
    const off = isOffDay(entry);
    setForm({
      staffId: s.id,
      dayOfWeek,
      working: !off,
      start_time: off ? '09:00' : entry!.start_time,
      end_time: off ? '18:00' : entry!.end_time,
      break_start: off ? '' : (entry!.break_start || ''),
      break_end: off ? '' : (entry!.break_end || ''),
    });
    setModalOpen(true);
  };

  const updateDayOfWeek = (dayOfWeek: string) => {
    setForm((prev) => {
      const existing = schedulesByStaff.get(prev.staffId)?.find((x) => x.day_of_week === dayOfWeek);
      const off = isOffDay(existing);
      return {
        ...prev,
        dayOfWeek,
        working: !off,
        start_time: off ? '09:00' : existing!.start_time,
        end_time: off ? '18:00' : existing!.end_time,
        break_start: off ? '' : (existing!.break_start || ''),
        break_end: off ? '' : (existing!.break_end || ''),
      };
    });
  };

  const updateStaff = (staffId: number) => {
    setForm((prev) => {
      const existing = schedulesByStaff.get(staffId)?.find((x) => x.day_of_week === prev.dayOfWeek);
      const off = isOffDay(existing);
      return {
        ...prev,
        staffId,
        working: !off,
        start_time: off ? '09:00' : existing!.start_time,
        end_time: off ? '18:00' : existing!.end_time,
        break_start: off ? '' : (existing!.break_start || ''),
        break_end: off ? '' : (existing!.break_end || ''),
      };
    });
  };

  const save = async () => {
    if (!form.staffId) return;
    setSaving(true);
    try {
      const current = schedulesByStaff.get(form.staffId) || [];
      const payload = WEEK_ORDER.map((d) => {
        const existing = current.find((x) => x.day_of_week === d) || {
          day_of_week: d, start_time: '00:00', end_time: '00:00', break_start: null, break_end: null, is_active: true,
        };
        if (d !== form.dayOfWeek) {
          const off = isOffDay(existing);
          return off
            ? { day_of_week: d, start_time: '00:00', end_time: '00:00', break_start: null, break_end: null, is_active: true }
            : { day_of_week: d, start_time: existing.start_time, end_time: existing.end_time, break_start: existing.break_start || null, break_end: existing.break_end || null, is_active: true };
        }
        if (!form.working) {
          return { day_of_week: d, start_time: '00:00', end_time: '00:00', break_start: null, break_end: null, is_active: true };
        }
        const break_start = form.break_start || null;
        const break_end = form.break_end || null;
        return { day_of_week: d, start_time: form.start_time, end_time: form.end_time, break_start, break_end, is_active: true };
      });
      await staffApi.updateSchedules(form.staffId, { schedules: payload });
      toast.success('Schedule updated');
      setModalOpen(false);
      fetchStaff();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save schedule');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-neutral-900">Scheduled Shifts</h1>
          <p className="text-sm text-neutral-500 mt-1">Weekly staff schedule grid</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="select-field w-auto" value={positionFilter} onChange={(e) => setPositionFilter(e.target.value)}>
            {POSITIONS.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('prev')} className="btn-secondary !px-3 !py-2">
            <ChevronLeft size={18} />
          </button>
          <button onClick={() => navigate('next')} className="btn-secondary !px-3 !py-2">
            <ChevronRight size={18} />
          </button>
          <h2 className="text-lg font-semibold text-neutral-900 ml-2">{weekRangeLabel}</h2>
          <button onClick={goToday} className="btn-secondary text-sm ml-1">Today</button>
        </div>
        <button onClick={openAddModal} className="btn-primary">
          <Check size={18} />
          Add Shift
        </button>
      </div>

      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : staff.length === 0 ? (
        <EmptyState title="No team members found" description="Adjust your filters or add staff members to see their schedules." />
      ) : (
        <div className="card !p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse min-w-[900px]">
              <thead>
                <tr className="text-left text-neutral-500 bg-neutral-50/80 border-b border-neutral-200">
                  <th className="px-5 py-3 font-medium min-w-[200px] sticky left-0 bg-neutral-50/95 z-10 border-r border-neutral-200">Team Member</th>
                  {WEEK.map((cfg, i) => {
                    const day = weekStart.subtract(1, 'day').add(i, 'day');
                    const isToday = day.isSame(dayjs(), 'day');
                    return (
                      <th key={cfg.key} className={`px-3 py-3 text-center font-medium min-w-[120px] border-r border-neutral-100 last:border-r-0 ${isToday ? 'bg-primary-50' : ''}`}>
                        <p className="text-xs text-neutral-500 uppercase">{day.format('ddd')}</p>
                        <p className={`text-sm font-semibold ${isToday ? 'text-primary-600' : 'text-neutral-900'}`}>{day.format('D')}</p>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {staff.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/50">
                    <td className="px-5 py-3 sticky left-0 bg-white z-10 border-r border-neutral-200">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-neutral-900 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {`${s.first_name?.[0] || ''}${s.last_name?.[0] || ''}`.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-neutral-900 truncate">{s.first_name} {s.last_name}</div>
                          <div className="text-xs text-neutral-500 flex items-center gap-1.5">
                            {s.job_title || '—'}
                            <StatusBadge status={s.status} />
                          </div>
                        </div>
                      </div>
                    </td>
                    {WEEK.map((cfg) => {
                      const entry = schedulesByStaff.get(s.id)?.find((x) => x.day_of_week === cfg.key);
                      const off = isOffDay(entry);
                      return (
                        <td key={cfg.key} className="px-3 py-2.5 text-center border-r border-neutral-100 last:border-r-0">
                          <button
                            onClick={() => openEditModal(s, cfg.key)}
                            className={`w-full h-full min-h-[56px] rounded-md px-2 py-1.5 text-left transition cursor-pointer ${
                              off
                                ? 'bg-neutral-50 text-neutral-400 hover:bg-neutral-100'
                                : 'bg-primary-50 border border-primary-200 hover:bg-primary-100/70'
                            }`}
                          >
                            {off ? (
                              <p className="text-xs font-medium px-1">Not Working</p>
                            ) : (
                              <div className="space-y-0.5">
                                <p className="text-sm font-semibold text-primary-700 whitespace-nowrap">
                                  {formatTime(entry!.start_time)} – {formatTime(entry!.end_time)}
                                </p>
                                {entry!.break_start && entry!.break_end && (
                                  <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                                    <Coffee size={11} />
                                    Break {formatTime(entry!.break_start)}–{formatTime(entry!.break_end)}
                                  </p>
                                )}
                              </div>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add / Edit Shift" maxWidth="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="label">Team Member</label>
            <select className="select-field" value={form.staffId} onChange={(e) => updateStaff(Number(e.target.value))}>
              {activeStaff.map((s) => (
                <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Day</label>
            <select className="select-field" value={form.dayOfWeek} onChange={(e) => updateDayOfWeek(e.target.value)}>
              {WEEK.map((cfg) => (
                <option key={cfg.key} value={cfg.key}>{cfg.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-neutral-600">
              <input
                type="checkbox"
                checked={form.working}
                onChange={(e) => setForm((prev) => ({ ...prev, working: e.target.checked }))}
                className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              />
              Working
            </label>
          </div>
          {form.working && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Start Time</label>
                <input type="time" className="input-field" value={form.start_time} onChange={(e) => setForm((prev) => ({ ...prev, start_time: e.target.value }))} />
              </div>
              <div>
                <label className="label">End Time</label>
                <input type="time" className="input-field" value={form.end_time} onChange={(e) => setForm((prev) => ({ ...prev, end_time: e.target.value }))} />
              </div>
              <div>
                <label className="label">Break Start (optional)</label>
                <input type="time" className="input-field" value={form.break_start} onChange={(e) => setForm((prev) => ({ ...prev, break_start: e.target.value }))} />
              </div>
              <div>
                <label className="label">Break End (optional)</label>
                <input type="time" className="input-field" value={form.break_end} onChange={(e) => setForm((prev) => ({ ...prev, break_end: e.target.value }))} />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
            <button onClick={save} disabled={saving} className="btn-primary">
              {saving ? 'Saving...' : 'Save Shift'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}