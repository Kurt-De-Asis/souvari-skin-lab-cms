import { useEffect, useState } from 'react';
import { Mail, Phone, MapPin, Calendar, Award, User, Plus, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import Drawer from '../../components/ui/Drawer';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import { appointmentsApi, membershipsApi, treatmentRecordsApi, customersApi } from '../../api';
import dayjs from 'dayjs';

interface CustomerDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  customer: {
    id: number;
    first_name: string;
    last_name: string;
    gender: string;
    date_of_birth?: string;
    address?: string;
    preferred_staff?: { id: number; first_name: string; last_name: string } | null;
    user?: { id: number; email: string; phone: string; status: string };
  } | null;
}

interface Appointment {
  id: number;
  date: string;
  start_time?: string;
  status: string;
  service?: { name: string };
  services?: Array<{ name: string }>;
}

export default function CustomerDetailDrawer({ open, onClose, customer }: CustomerDetailDrawerProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [membership, setMembership] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'details' | 'records' | 'notes' | 'allergies' | 'treatments' | 'history'>('overview');

  const [newNote, setNewNote] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [submittingAllergy, setSubmittingAllergy] = useState(false);

  const reloadData = async () => {
    if (!customer) return;
    try {
      const params = { customer_id: String(customer.id), limit: '50', page: '1' };
      const [apptRes, memRes, recRes] = await Promise.all([
        appointmentsApi.list(params),
        membershipsApi.list({ customer_id: String(customer.id) }),
        treatmentRecordsApi.list({ customer_id: String(customer.id), limit: '50', page: '1' }),
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
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (!open || !customer) return;
    let cancelled = false;
    setLoading(true);
    setAppointments([]);
    setMembership(null);
    setRecords([]);
    setActiveTab('overview');
    setNewNote('');
    setNewAllergy('');

    const load = async () => {
      try {
        const params = { customer_id: String(customer.id), limit: '50', page: '1' };
        const [apptRes, memRes, recRes] = await Promise.all([
          appointmentsApi.list(params),
          membershipsApi.list({ customer_id: String(customer.id) }),
          treatmentRecordsApi.list({ customer_id: String(customer.id), limit: '50', page: '1' }),
        ]);
        if (cancelled) return;
        const apptData = apptRes.data?.data;
        setAppointments(Array.isArray(apptData?.data) ? apptData.data : Array.isArray(apptData) ? apptData : []);
        const memData = memRes.data?.data;
        const memList = Array.isArray(memData?.data) ? memData.data : Array.isArray(memData) ? memData : [];
        setMembership(memList.length ? memList[0] : null);
        const recData = recRes.data?.data;
        setRecords(Array.isArray(recData?.data) ? recData.data : Array.isArray(recData) ? recData : []);
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
  }, [open, customer]);

  if (!customer) return null;

  const userName = `${customer.first_name} ${customer.last_name}`;
  const dob = customer.date_of_birth ? dayjs(customer.date_of_birth).format('MMM D, YYYY') : null;

  return (
    <Drawer open={open} onClose={onClose} title={userName} subtitle={customer.user?.email || 'Patient clinical workspace'} maxWidth="max-w-xl">
      {loading ? (
        <div className="py-16"><LoadingSpinner /></div>
      ) : (
        <div className="space-y-6">
          {/* Header Profile Card */}
          <div className="bg-neutral-50 rounded-lg p-5 border border-neutral-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-primary-100 text-primary-800 flex items-center justify-center font-semibold text-xl tracking-wide">
                {customer.first_name.charAt(0)}{customer.last_name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-neutral-900 truncate">{userName}</h2>
                  <StatusBadge status={customer.user?.status || 'active'} />
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">{customer.user?.email || 'No email on record'} · {customer.user?.phone || 'No phone'}</p>
              </div>
            </div>
          </div>

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
                    <p className="text-lg font-semibold text-neutral-900">
                      {appointments.filter((a) => ['pending', 'confirmed', 'checked_in', 'in_progress'].includes(a.status)).length}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Recent Activity & Summary</h3>
                  <div className="card divide-y divide-neutral-100 !p-0">
                    <div className="p-4 flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Gender</span>
                      <span className="font-medium text-neutral-900 capitalize">{customer.gender || '—'}</span>
                    </div>
                    <div className="p-4 flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Date of Birth</span>
                      <span className="font-medium text-neutral-900">{dob || '—'}</span>
                    </div>
                    <div className="p-4 flex items-center justify-between text-sm">
                      <span className="text-neutral-500">Preferred Staff</span>
                      <span className="font-medium text-neutral-900">
                        {customer.preferred_staff ? `${customer.preferred_staff.first_name} ${customer.preferred_staff.last_name}` : 'None assigned'}
                      </span>
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
                      const svcName = a.service?.name || a.services?.[0]?.name || 'Service Appointment';
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
                    <p className="font-medium text-neutral-900 mt-0.5">{customer.user?.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase">Phone Number</p>
                    <p className="font-medium text-neutral-900 mt-0.5">{customer.user?.phone || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase">Gender</p>
                    <p className="font-medium text-neutral-900 mt-0.5 capitalize">{customer.gender || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase">Date of Birth</p>
                    <p className="font-medium text-neutral-900 mt-0.5">{dob || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-neutral-400 uppercase">Address</p>
                    <p className="font-medium text-neutral-900 mt-0.5">{customer.address || '—'}</p>
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
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-neutral-900">{r.service_name || r.service?.name || 'Clinic Record'}</p>
                          <StatusBadge status={r.status || 'completed'} />
                        </div>
                        {r.date && <p className="text-xs text-neutral-500">Date: {dayjs(r.date).format('MMM D, YYYY')}</p>}
                        {r.notes && <p className="text-sm text-neutral-600 bg-neutral-50 p-2.5 rounded-md mt-2">{r.notes}</p>}
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
                        <div className="flex items-center justify-between text-xs text-neutral-400 mb-2">
                          <span className="font-medium text-neutral-700">{r.service_name || r.service?.name || 'General Clinical Note'}</span>
                          <span>{r.date ? dayjs(r.date).format('MMM D, YYYY') : r.created_at ? dayjs(r.created_at).format('MMM D, YYYY') : ''}</span>
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

                {records.filter(r => r.notes && r.notes.toLowerCase().includes('allergy')).length === 0 ? (
                  <div className="card p-5 text-center py-8">
                    <p className="text-sm font-medium text-neutral-900">No allergy alerts recorded.</p>
                    <p className="text-xs text-neutral-500 mt-1">Add sensitivities above to display urgent clinical warnings.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {records.filter(r => r.notes && r.notes.toLowerCase().includes('allergy')).map((r) => (
                      <div key={r.id} className="card p-4 bg-red-50/50 border-red-200 flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-red-800">{r.notes}</p>
                          <p className="text-xs text-neutral-500 mt-1">Recorded: {r.date ? dayjs(r.date).format('MMM D, YYYY') : dayjs(r.created_at).format('MMM D, YYYY')}</p>
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
                      <div key={r.id} className="card p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{r.service_name || r.service?.name || 'Treatment'}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">{r.date ? dayjs(r.date).format('MMM D, YYYY') : '—'}</p>
                        </div>
                        <StatusBadge status={r.status || 'completed'} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Past Services & Treatment Timeline</h3>
                {records.length === 0 && appointments.length === 0 ? (
                  <p className="text-sm text-neutral-500">No past services or treatment history found.</p>
                ) : (
                  <div className="space-y-3">
                    {records.map((r) => (
                      <div key={`rec-${r.id}`} className="card p-4 border-l-4 border-l-primary-500 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{r.service_name || r.service?.name || 'Service Availed'}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">Date: {r.date ? dayjs(r.date).format('MMM D, YYYY') : '—'}</p>
                        </div>
                        <StatusBadge status={r.status || 'completed'} />
                      </div>
                    ))}
                    {appointments.filter(a => a.status === 'completed').map((a) => (
                      <div key={`apt-${a.id}`} className="card p-4 border-l-4 border-l-neutral-400 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-neutral-900">{a.service?.name || a.services?.[0]?.name || 'Completed Appointment'}</p>
                          <p className="text-xs text-neutral-500 mt-0.5">Date: {dayjs(a.date).format('MMM D, YYYY')}</p>
                        </div>
                        <StatusBadge status={a.status} />
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

function customerAnyHasAllergies(customer: any, records: any[]): boolean {
  if (customer.allergies || customer.medical_notes) return true;
  return records.some(r => r.allergies || (r.notes && r.notes.toLowerCase().includes('allergy')));
}