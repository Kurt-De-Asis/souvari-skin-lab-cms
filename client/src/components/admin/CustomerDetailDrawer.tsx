import { useCallback, useEffect, useState } from 'react';
import { Plus, Loader2, Pencil, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Drawer from '../../components/ui/Drawer';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { appointmentsApi, membershipsApi, treatmentRecordsApi, customersApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import dayjs from 'dayjs';

interface CustomerDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
  } | null;
}

interface Appointment {
  id: number;
  date: string;
  start_time?: string;
  status: string;
  services?: Array<{ name: string }>;
}

/** Full customer row from GET /customers/:id — the authoritative source. */
interface CustomerProfile {
  id: number;
  first_name: string;
  last_name: string;
  gender?: string | null;
  date_of_birth?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  notes?: string | null;
  user?: { id: number; email: string; phone: string; status: string } | null;
}

/**
 * A treatment record has no `status` column and an optional `service`, so the
 * drawer derives both: the linked appointment's status when there is one, and a
 * label describing what the record actually is otherwise.
 */
interface TreatmentRecord {
  id: number;
  appointment_id?: number | null;
  treatment_date?: string | null;
  created_at?: string | null;
  notes?: string | null;
  service?: { name: string } | null;
  appointment?: { id: number; status: string; start_time?: string } | null;
}

const GENDER_OPTIONS = [
  { value: '', label: 'Not recorded' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const ALLERGY_PREFIX = '[ALLERGY ALERT]';

function isAllergyAlert(r: { notes?: string | null }): boolean {
  return !!r.notes?.trim().toUpperCase().startsWith(ALLERGY_PREFIX);
}

function stripAllergyPrefix(notes: string): string {
  return notes.trim().slice(ALLERGY_PREFIX.length).trim();
}

/** Treatment records store `treatment_date`, never `date`. */
function recordDate(r: TreatmentRecord): string | null {
  return r.treatment_date || r.created_at || null;
}

/**
 * Title for a record: the real service when linked, otherwise what the record
 * actually represents. The old code invented "Service Availed"/"Treatment" for
 * every record that had no service, which is why notes and alerts looked
 * identical to actual treatments.
 */
function recordTitle(r: TreatmentRecord): string {
  if (r.service?.name) return r.service.name;
  if (isAllergyAlert(r)) return 'Allergy Alert';
  if (r.notes?.trim()) return 'Clinical Note';
  return 'Treatment';
}

function appointmentServiceNames(a: Appointment): string {
  return (a.services ?? []).map((s) => s.name).join(', ');
}

export default function CustomerDetailDrawer({ open, onClose, customer }: CustomerDetailDrawerProps) {
  const { user } = useAuth();
  const canEdit = user?.role === 'admin' || user?.role === 'staff';

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [membership, setMembership] = useState<any>(null);
  const [records, setRecords] = useState<TreatmentRecord[]>([]);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'details' | 'records' | 'notes' | 'allergies' | 'treatments' | 'history'>('overview');

  const [newNote, setNewNote] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [submittingAllergy, setSubmittingAllergy] = useState(false);

  const [editing, setEditing] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [form, setForm] = useState({
    gender: '',
    date_of_birth: '',
    phone: '',
    address: '',
    city: '',
  });

  const loadProfile = useCallback(async (id: number) => {
    const { data } = await customersApi.getById(id);
    return (data.data ?? null) as CustomerProfile | null;
  }, []);

  const reloadData = useCallback(async () => {
    if (!customer) return;
    try {
      const params = { customer_id: String(customer.id), limit: '50', page: '1' };
      const [apptRes, memRes, recRes, profileRes] = await Promise.all([
        appointmentsApi.list(params),
        membershipsApi.list({ customer_id: String(customer.id) }),
        treatmentRecordsApi.list({ customer_id: String(customer.id), limit: '50', page: '1' }),
        loadProfile(customer.id).catch(() => null),
      ]);
      const apptData = apptRes.data?.data;
      const apptList = Array.isArray(apptData?.data) ? apptData.data : Array.isArray(apptData) ? apptData : [];
      setAppointments(apptList);
      const memData = memRes.data?.data;
      const memList = Array.isArray(memData?.data) ? memData.data : Array.isArray(memData) ? memData : [];
      setMembership(memList.length ? memList[0] : null);
      const recData = recRes.data?.data;
      const recList = Array.isArray(recData?.data) ? recData.data : Array.isArray(recData) ? recData : [];
      setRecords(recList);
      if (profileRes) setProfile(profileRes);
    } catch {
      // silent
    }
  }, [customer, loadProfile]);

  useEffect(() => {
    if (!open || !customer) return;
    let cancelled = false;
    setLoading(true);
    setAppointments([]);
    setMembership(null);
    setRecords([]);
    setProfile(null);
    setActiveTab('overview');
    setNewNote('');
    setNewAllergy('');
    setEditing(false);
    setProfileError('');

    const load = async () => {
      try {
        const params = { customer_id: String(customer.id), limit: '50', page: '1' };
        const [apptRes, memRes, recRes, profileRes] = await Promise.all([
          appointmentsApi.list(params),
          membershipsApi.list({ customer_id: String(customer.id) }),
          treatmentRecordsApi.list({ customer_id: String(customer.id), limit: '50', page: '1' }),
          loadProfile(customer.id).catch(() => null),
        ]);
        if (cancelled) return;
        const apptData = apptRes.data?.data;
        setAppointments(Array.isArray(apptData?.data) ? apptData.data : Array.isArray(apptData) ? apptData : []);
        const memData = memRes.data?.data;
        const memList = Array.isArray(memData?.data) ? memData.data : Array.isArray(memData) ? memData : [];
        setMembership(memList.length ? memList[0] : null);
        const recData = recRes.data?.data;
        setRecords(Array.isArray(recData?.data) ? recData.data : Array.isArray(recData) ? recData : []);
        if (profileRes) setProfile(profileRes);
      } catch {
        // silent
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [open, customer, loadProfile]);

  if (!customer) return null;

  // Prefer the fetched record, falling back to whatever the caller passed in
  // (the appointment list only selects id/first_name/last_name).
  const firstName = profile?.first_name || customer.first_name;
  const lastName = profile?.last_name || customer.last_name;
  const userName = `${firstName} ${lastName}`;
  const email = profile?.user?.email || null;
  const phone = profile?.user?.phone || null;
  const dob = profile?.date_of_birth ? dayjs(profile.date_of_birth).format('MMM D, YYYY') : null;
  const gender = profile?.gender || null;
  const fullAddress = [profile?.address, profile?.city, profile?.state, profile?.postal_code]
    .filter(Boolean)
    .join(', ');

  const startEdit = () => {
    setForm({
      gender: profile?.gender || '',
      date_of_birth: profile?.date_of_birth ? dayjs(profile.date_of_birth).format('YYYY-MM-DD') : '',
      phone: profile?.user?.phone || '',
      address: profile?.address || '',
      city: profile?.city || '',
    });
    setProfileError('');
    setEditing(true);
  };

  const saveProfile = async () => {
    if (!customer) return;
    setSavingProfile(true);
    setProfileError('');
    try {
      // Empty strings become NULL server-side; only send what the form owns.
      const payload: Record<string, string> = {};
      if (form.gender !== (profile?.gender || '')) payload.gender = form.gender;
      if (form.date_of_birth !== (profile?.date_of_birth ? dayjs(profile.date_of_birth).format('YYYY-MM-DD') : '')) {
        payload.date_of_birth = form.date_of_birth;
      }
      if (form.phone !== (profile?.user?.phone || '')) payload.phone = form.phone;
      if (form.address !== (profile?.address || '')) payload.address = form.address;
      if (form.city !== (profile?.city || '')) payload.city = form.city;
      if (Object.keys(payload).length > 0) {
        await customersApi.update(customer.id, payload);
        setProfile(await loadProfile(customer.id));
      }
      toast.success('Patient details updated');
      setEditing(false);
    } catch (err: any) {
      setProfileError(err?.response?.data?.message || 'Failed to update patient details');
    } finally {
      setSavingProfile(false);
    }
  };

  // Completed appointments already appear through their linked treatment record.
  const recordAppointmentIds = new Set(records.map((r) => r.appointment_id).filter(Boolean) as number[]);
  const todayStr = dayjs().format('YYYY-MM-DD');
  const upcomingCount = appointments.filter(
    (a) => ['pending', 'confirmed', 'checked_in', 'in_progress'].includes(a.status) && a.date >= todayStr
  ).length;

  const history = [
    ...records.map((r) => ({
      key: `rec-${r.id}`,
      date: recordDate(r),
      title: recordTitle(r),
      status: r.appointment?.status || null,
      isRecord: true,
    })),
    ...appointments
      .filter((a) => a.status === 'completed' && !recordAppointmentIds.has(a.id))
      .map((a) => ({
        key: `apt-${a.id}`,
        date: a.date,
        title: appointmentServiceNames(a) || 'Completed Appointment',
        status: a.status,
        isRecord: false,
      })),
  ].sort((x, y) => (x.date && y.date ? dayjs(y.date).valueOf() - dayjs(x.date).valueOf() : x.date ? -1 : 1));

  return (
    <Drawer open={open} onClose={onClose} title={userName} subtitle={email || 'Patient clinical workspace'} maxWidth="max-w-xl">
      {loading ? (
        <div className="py-16"><LoadingSpinner /></div>
      ) : (
        <div className="space-y-6">
          {/* Header Profile Card */}
          <div className="bg-neutral-50 rounded-lg p-5 border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-semibold text-xl tracking-wide">
                {firstName.charAt(0)}{lastName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-neutral-900 truncate">{userName}</h2>
                  <StatusBadge status={profile?.user?.status || 'active'} />
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{email || 'No email on record'} · {phone || 'No phone'}</p>
              </div>
            </div>
            {canEdit && !editing && (
              <button type="button" onClick={startEdit} className="btn-secondary !py-1.5 !px-3 text-xs flex items-center gap-1.5 self-start">
                <Pencil size={13} /> Edit details
              </button>
            )}
          </div>

          {editing && (
            <div className="card p-4 space-y-3 border-primary-200">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-neutral-700 uppercase">Edit Patient Details</p>
                <button type="button" onClick={() => { setEditing(false); setProfileError(''); }} className="text-neutral-400 hover:text-neutral-700">
                  <X size={15} />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="label">Gender</label>
                  <select
                    className="select-field"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    {GENDER_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Date of Birth</label>
                  <input
                    type="date"
                    className="input-field"
                    value={form.date_of_birth}
                    onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input
                    type="tel"
                    className="input-field"
                    placeholder="No phone on record"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">City</label>
                  <input
                    className="input-field"
                    placeholder="No city on record"
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="label">Address</label>
                  <input
                    className="input-field"
                    placeholder="No address on record"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />
                </div>
              </div>
              {profileError && <p className="text-xs text-red-600">{profileError}</p>}
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => { setEditing(false); setProfileError(''); }} className="btn-secondary !py-1.5 !px-3 text-xs">
                  Cancel
                </button>
                <button type="button" onClick={saveProfile} disabled={savingProfile} className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5">
                  {savingProfile ? <Loader2 size={13} className="animate-spin" /> : null}
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Navigation Tabs (Fresha-inspired context navigation) */}
          <div className="flex items-center gap-1 overflow-x-auto border-b border-neutral-200 pb-2 text-xs font-semibold uppercase tracking-[0.14em]">
            {[
              { key: 'overview', label: 'Overview' },
              { key: 'appointments', label: 'Appointments' },
              { key: 'details', label: 'Details' },
              { key: 'records', label: 'Records' },
              { key: 'notes', label: 'Notes' },
              { key: 'allergies', label: 'Allergies' },
              { key: 'treatments', label: 'Treatments' },
              { key: 'history', label: 'History' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-3 py-2 rounded-md transition whitespace-nowrap ${
                  activeTab === tab.key
                    ? 'bg-primary-500 text-white font-bold'
                    : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="pt-2">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="card p-4 bg-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400 mb-1">Active Membership</p>
                    {membership ? (
                      <div>
                        <p className="text-sm font-bold text-neutral-900">{membership.plan?.name || membership.plan_name || 'Membership Active'}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">Tier: {membership.tier || 'Standard'}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-neutral-500">No active membership</p>
                    )}
                  </div>
                  <div className="card p-4 bg-white">
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-400 mb-1">Upcoming Appointments</p>
                    <p className="text-lg font-semibold text-neutral-900">{upcomingCount}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Recent Activity & Summary</h3>
                  <div className="card divide-y divide-neutral-100 !p-0">
                    <div className="p-4 flex items-center justify-between text-sm gap-4">
                      <span className="text-neutral-500">Gender</span>
                      <span className="font-medium text-neutral-900 capitalize">{gender || '—'}</span>
                    </div>
                    <div className="p-4 flex items-center justify-between text-sm gap-4">
                      <span className="text-neutral-500">Date of Birth</span>
                      <span className="font-medium text-neutral-900">{dob || '—'}</span>
                    </div>
                    <div className="p-4 flex items-center justify-between text-sm gap-4">
                      <span className="text-neutral-500">Contact</span>
                      <span className="font-medium text-neutral-900 text-right truncate">{email || '—'}{phone ? ` · ${phone}` : ''}</span>
                    </div>
                    <div className="p-4 flex items-center justify-between text-sm gap-4">
                      <span className="text-neutral-500">Address</span>
                      <span className="font-medium text-neutral-900 text-right">{fullAddress || '—'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'appointments' && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Appointment History</h3>
                {appointments.length === 0 ? (
                  <p className="text-sm text-neutral-500">No appointments recorded for this patient.</p>
                ) : (
                  <div className="space-y-3">
                    {appointments.map((a) => {
                      const svcName = appointmentServiceNames(a) || 'Service Appointment';
                      const when = `${dayjs(a.date).format('MMM D, YYYY')}${a.start_time ? ` at ${a.start_time.slice(0, 5)}` : ''}`;
                      return (
                        <div key={a.id} className="card p-4 flex items-center justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-neutral-900">{svcName}</p>
                            <p className="text-xs text-neutral-500 mt-0.5">{when}</p>
                          </div>
                          <StatusBadge status={a.status} />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'details' && (
              <div className="card space-y-4 p-5">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500 mb-2">Patient Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-xs text-neutral-400 uppercase">Full Name</p>
                    <p className="font-medium text-neutral-900 mt-0.5">{userName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase">Email Address</p>
                    <p className="font-medium text-neutral-900 mt-0.5">{email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase">Phone Number</p>
                    <p className="font-medium text-neutral-900 mt-0.5">{phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase">Gender</p>
                    <p className="font-medium text-neutral-900 mt-0.5 capitalize">{gender || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase">Date of Birth</p>
                    <p className="font-medium text-neutral-900 mt-0.5">{dob || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase">Address</p>
                    <p className="font-medium text-neutral-900 mt-0.5">{fullAddress || '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'records' && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Clinic Records & Charts</h3>
                {records.length === 0 ? (
                  <p className="text-sm text-neutral-500">No clinic records found for this patient.</p>
                ) : (
                  <div className="space-y-3">
                    {records.map((r) => (
                      <div key={r.id} className="card p-4 space-y-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-semibold text-neutral-900">{recordTitle(r)}</p>
                          {r.appointment?.status
                            ? <StatusBadge status={r.appointment.status} />
                            : <span className="text-[10px] uppercase tracking-wide text-neutral-400 flex-shrink-0">Record</span>}
                        </div>
                        {recordDate(r) && <p className="text-xs text-neutral-500">Date: {dayjs(recordDate(r)!).format('MMM D, YYYY')}</p>}
                        {r.notes && (
                          <p className="text-sm text-neutral-600 bg-neutral-50 p-2.5 rounded-md mt-2">
                            {isAllergyAlert(r) ? stripAllergyPrefix(r.notes) : r.notes}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'notes' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Clinical & Visit Notes</h3>
                </div>

                {/* Add Note Form */}
                <div className="card p-4 space-y-3 bg-neutral-50 border-neutral-200">
                  <p className="text-xs font-semibold text-neutral-700 uppercase">Add New Patient Note</p>
                  <textarea
                    className="input-field text-sm"
                    rows={2}
                    placeholder="Type clinical observation or visit note..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!newNote.trim() || submittingNote}
                      onClick={async () => {
                        if (!newNote.trim()) return;
                        setSubmittingNote(true);
                        try {
                          await treatmentRecordsApi.create({
                            customer_id: customer.id,
                            treatment_date: new Date().toISOString().slice(0, 10),
                            notes: newNote.trim(),
                          });
                          toast.success('Note added successfully');
                          setNewNote('');
                          await reloadData();
                        } catch {
                          toast.error('Failed to add note');
                        } finally {
                          setSubmittingNote(false);
                        }
                      }}
                      className="btn-primary !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                    >
                      {submittingNote ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      Save Note
                    </button>
                  </div>
                </div>

                {records.filter(r => r.notes).length === 0 ? (
                  <p className="text-sm text-neutral-500 pt-2">No notes recorded for this patient yet.</p>
                ) : (
                  <div className="space-y-3">
                    {records.filter(r => r.notes).map((r) => (
                      <div key={r.id} className="card p-4">
                        <div className="flex items-center justify-between gap-3 text-xs text-neutral-400 mb-2">
                          <span className="font-medium text-neutral-700">{recordTitle(r)}</span>
                          <span className="flex-shrink-0">{recordDate(r) ? dayjs(recordDate(r)!).format('MMM D, YYYY') : ''}</span>
                        </div>
                        <p className="text-sm text-neutral-800 whitespace-pre-wrap">{r.notes}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'allergies' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Allergies & Sensitivities</h3>
                </div>

                {/* Add Allergy Form */}
                <div className="card p-4 space-y-3 bg-red-50/40 border-red-200">
                  <p className="text-xs font-semibold text-red-900 uppercase">Add Allergy / Sensitivity Alert</p>
                  <input
                    type="text"
                    className="input-field text-sm bg-white"
                    placeholder="e.g., Penicillin, Latex, Lidocaine sensitivity..."
                    value={newAllergy}
                    onChange={(e) => setNewAllergy(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!newAllergy.trim() || submittingAllergy}
                      onClick={async () => {
                        if (!newAllergy.trim()) return;
                        setSubmittingAllergy(true);
                        try {
                          await treatmentRecordsApi.create({
                            customer_id: customer.id,
                            treatment_date: new Date().toISOString().slice(0, 10),
                            notes: `[ALLERGY ALERT]: ${newAllergy.trim()}`,
                          });
                          toast.success('Allergy alert recorded');
                          setNewAllergy('');
                          await reloadData();
                        } catch {
                          toast.error('Failed to record allergy');
                        } finally {
                          setSubmittingAllergy(false);
                        }
                      }}
                      className="btn-danger !py-1.5 !px-3 text-xs flex items-center gap-1.5"
                    >
                      {submittingAllergy ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                      Add Allergy Alert
                    </button>
                  </div>
                </div>

                {records.filter(isAllergyAlert).length === 0 ? (
                  <div className="card p-5 text-center py-8">
                    <p className="text-sm font-medium text-neutral-900">No allergy alerts recorded.</p>
                    <p className="text-xs text-neutral-500 mt-1">Add sensitivities above to display urgent clinical warnings.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {records.filter(isAllergyAlert).map((r) => (
                      <div key={r.id} className="card p-4 bg-red-50/50 border-red-200 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-red-800">{stripAllergyPrefix(r.notes!)}</p>
                          <p className="text-xs text-neutral-500 mt-1">
                            Recorded: {recordDate(r) ? dayjs(recordDate(r)!).format('MMM D, YYYY') : '—'}
                          </p>
                        </div>
                        <StatusBadge status="no_show" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'treatments' && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Treatments</h3>
                {records.length === 0 ? (
                  <p className="text-sm text-neutral-500">No treatments on record.</p>
                ) : (
                  <div className="space-y-3">
                    {records.map((r) => (
                      <div key={r.id} className="card p-4 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className={`text-sm font-semibold ${isAllergyAlert(r) ? 'text-red-800' : 'text-neutral-900'}`}>
                            {recordTitle(r)}
                          </p>
                          <p className="text-xs text-neutral-500 mt-0.5">{recordDate(r) ? dayjs(recordDate(r)!).format('MMM D, YYYY') : '—'}</p>
                          {isAllergyAlert(r) && (
                            <p className="text-xs text-red-600 mt-0.5">{stripAllergyPrefix(r.notes!)}</p>
                          )}
                        </div>
                        {r.appointment?.status
                          ? <StatusBadge status={r.appointment.status} />
                          : <span className="text-[10px] uppercase tracking-wide text-neutral-400 flex-shrink-0">Record</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Past Services & Treatment Timeline</h3>
                {history.length === 0 ? (
                  <p className="text-sm text-neutral-500">No past services or treatment history found.</p>
                ) : (
                  <div className="space-y-3">
                    {history.map((h) => (
                      <div
                        key={h.key}
                        className={`card p-4 border-l-4 flex items-center justify-between gap-3 ${
                          h.isRecord ? 'border-l-primary-500' : 'border-l-neutral-400'
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-neutral-900">{h.title}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">Date: {h.date ? dayjs(h.date).format('MMM D, YYYY') : '—'}</p>
                        </div>
                        {h.status && <StatusBadge status={h.status} />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
