import { useState, useEffect, useRef, useCallback } from 'react';
import dayjs from 'dayjs';
import { Check, ChevronDown } from 'lucide-react';
import EmptyState from '../../shared/EmptyState';
import CustomerDetailDrawer from '../../../components/admin/CustomerDetailDrawer';
import LoadingSpinner from '../../shared/LoadingSpinner';
import { formatPosition } from '../../../utils/format';
import { isBookingEditable, statusBlockClass, statusLabel, APPOINTMENT_STATUS_META } from '../../../utils/appointmentStatus';
import BookingBlockMenu, { CompletedLockBadge } from './BookingBlockMenu';
import type { BookingAppointment, StaffMember } from './types';

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const HOUR_HEIGHT = 80;
const GUTTER_W = 80;
const COL_MIN_W = 160;
const MENU_OFFSET = 6;
// Height of the sticky staff header, so an auto-scroll never parks the open
// menu underneath it.
const HEADER_GUARD = 56;

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function toTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function formatHour(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return dayjs().hour(h).minute(m).format(m === 0 ? 'h A' : 'h:mm A');
}

function initials(name: string): string {
  const [first = '', last = ''] = name.split(' ');
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

interface ScheduledStaff {
  staff: StaffMember;
  schedule?: {
    start_time: string;
    end_time: string;
    break_start?: string | null;
    break_end?: string | null;
    is_active: boolean;
  } | null;
  off: boolean;
}

interface BookingGridProps {
  date: dayjs.Dayjs;
  staff: StaffMember[];
  appointments: BookingAppointment[];
  loading: boolean;
  onSlotClick: (staffId: number, startTime: string) => void;
  onAppointmentClick: (appt: BookingAppointment) => void;
  onStatusChange: (appt: BookingAppointment, status: string, reason?: string) => Promise<boolean>;
  onAssignStaff: (appt: BookingAppointment, staffId: number) => Promise<boolean>;
  onAddService: (appt: BookingAppointment) => void;
  onEdit: (appt: BookingAppointment) => void;
  busyAppointmentId: number | null;
  selectedAppointmentId?: number | null;
}

export default function BookingGrid({
  date,
  staff,
  appointments,
  loading,
  onSlotClick,
  onAppointmentClick,
  onStatusChange,
  onAssignStaff,
  onAddService,
  onEdit,
  busyAppointmentId,
  selectedAppointmentId,
}: BookingGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const today = dayjs().format('YYYY-MM-DD');
  const isToday = date.format('YYYY-MM-DD') === today;
  const isPast = date.format('YYYY-MM-DD') < today;
  const canBook = !isPast;

  const [hoverSlot, setHoverSlot] = useState<{ staffId: number; minutes: number } | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<any | null>(null);
  // The open menu is tracked with its block geometry so the popover can be
  // rendered as a sibling of the block: the block itself is `overflow-hidden`
  // and would clip the dropdown.
  const [openMenu, setOpenMenu] = useState<{
    id: number;
    staffId: number;
    top: number;
    height: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const columns: ScheduledStaff[] = staff
    .filter((s) => (s.schedules ?? []).length > 0)
    .map((s) => {
      const schedule = s.schedules?.find((sch) => sch.day_of_week === DAYS[date.day()]) ?? null;
      const off =
        !schedule ||
        !schedule.is_active ||
        (schedule.start_time === '00:00' && schedule.end_time === '00:00');
      return { staff: s, schedule: off ? null : schedule, off };
    });

  const scheduled = columns.filter((c) => !c.off && c.schedule);
  const starts = scheduled.map((c) => toMinutes(c.schedule!.start_time));
  const ends = scheduled.map((c) => toMinutes(c.schedule!.end_time));
  const viewStart = starts.length ? Math.min(...starts) : 0;
  const viewEnd = ends.length ? Math.max(...ends) : 0;

  const nowMin = toMinutes(dayjs().format('HH:mm'));
  const viewMinutes = Math.max(viewEnd - viewStart, 1);
  const totalHeight = (viewMinutes / 60) * HOUR_HEIGHT;

  const yPos = (minutes: number) => ((minutes - viewStart) / viewMinutes) * totalHeight;
  const durHeight = (start: number, end: number) => ((end - start) / viewMinutes) * totalHeight;

  const gridlines: number[] = [];
  const firstTick = Math.ceil(viewStart / 60) * 60;
  for (let t = firstTick; t <= viewEnd; t += 60) gridlines.push(t);

  const showNow = isToday && nowMin >= viewStart && nowMin <= viewEnd;

  // AutoScroll to current time after staff loads so today opens centered on 'now'
  useEffect(() => {
    if (isToday && scheduled.length > 0 && containerRef.current) {
      const target = yPos(nowMin) - containerRef.current.clientHeight / 2;
      containerRef.current.scrollTo({ top: Math.max(0, target) });
    }
  }, [isToday, scheduled.length]);

  // Close the open menu when the day or data changes out from under it.
  useEffect(() => {
    setOpenMenu(null);
  }, [date, appointments]);

  // The customer drawer covers the page with a full-screen backdrop, so an open
  // block menu would stay visible through it, floating outside the drawer.
  useEffect(() => {
    if (selectedCustomer) setOpenMenu(null);
  }, [selectedCustomer]);

  const toggleMenu = useCallback((appt: BookingAppointment, blockTop: number, blockHeight: number) => {
    setOpenMenu((prev) =>
      prev?.id === appt.id
        ? null
        : { id: appt.id, staffId: appt.staff.id, top: blockTop, height: blockHeight }
    );
  }, []);

  // The menu always renders below its block. When the block sits low in the
  // scroll viewport, scroll just enough to bring the whole menu into view
  // instead of flipping it up over the block it belongs to. Measured with real
  // rects so the sticky header offset never skews the maths.
  useEffect(() => {
    if (!openMenu) return;
    const container = containerRef.current;
    const menu = menuRef.current;
    if (!container || !menu) return;
    const keepVisible = () => {
      const cRect = container.getBoundingClientRect();
      const mRect = menu.getBoundingClientRect();
      if (mRect.bottom > cRect.bottom) {
        container.scrollBy({ top: mRect.bottom - cRect.bottom + 8, behavior: 'smooth' });
      } else if (mRect.top < cRect.top + HEADER_GUARD) {
        container.scrollBy({ top: mRect.top - cRect.top - HEADER_GUARD, behavior: 'smooth' });
      }
    };
    keepVisible();
    // Sub-panels (status / specialist / cancel) have different heights, so
    // re-check whenever the menu grows or shrinks.
    const ro = new ResizeObserver(keepVisible);
    ro.observe(menu);
    return () => ro.disconnect();
  }, [openMenu]);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, staffId: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickedMin = ((e.clientY - rect.top) / rect.height) * viewMinutes + viewStart;
      const snapped = Math.floor(clickedMin / 30) * 30;
      if (snapped + 30 > viewEnd) return;
      if (isToday && snapped < nowMin) return;
      onSlotClick(staffId, toTimeString(snapped));
    },
    [viewStart, viewMinutes, viewEnd, onSlotClick, isToday, nowMin]
  );

  const handleTrackMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>, staffId: number) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const hoveredMin = ((e.clientY - rect.top) / rect.height) * viewMinutes + viewStart;
      const snapped = Math.floor(hoveredMin / 30) * 30;
      setHoverSlot({ staffId, minutes: snapped });
    },
    [viewStart, viewMinutes]
  );

  const handleTrackLeave = useCallback(() => setHoverSlot(null), []);

  const gridMinWidth = GUTTER_W + columns.length * COL_MIN_W;

  const scheduledStaff = scheduled;

  return (
    <div className="flex flex-col h-full">
      {loading ? (
        <LoadingSpinner fullScreen={false} />
      ) : scheduledStaff.length === 0 ? (
        <EmptyState
          title="No staff scheduled for this day"
          description="Configure staff shifts (Team → Scheduled Shifts) to see the booking grid."
        />
      ) : (
        <>
          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs text-neutral-500 shrink-0 px-4 py-2 border-b border-neutral-100">
            <span className="font-medium mr-1">Status:</span>
            {APPOINTMENT_LEGEND.map(({ status, dot }) => (
              <span key={status} className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: dot }} />
                {statusLabel(status)}
              </span>
            ))}
          </div>
          <div ref={containerRef} className="flex-1 min-h-0 overflow-auto scrollbar-hide">
          <div style={{ minWidth: gridMinWidth, height: totalHeight }} className="relative">
            {/* Sticky header — staff column headers */}
            <div className="flex sticky top-0 z-30 bg-white border-b border-neutral-200">
              <div className="sticky left-0 z-40 bg-white" style={{ width: GUTTER_W, minWidth: GUTTER_W }} />
              {columns.map((c) => (
                <div
                  key={c.staff.id}
                  className="border-l border-neutral-200 px-2 py-2 text-center flex-1"
                  style={{ minWidth: COL_MIN_W }}
                >
                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${c.off ? 'bg-neutral-100 text-neutral-400' : 'bg-primary-100 text-primary-700'}`}>
                    <span className="text-[10px] font-semibold">{initials(`${c.staff.first_name} ${c.staff.last_name}`)}</span>
                  </div>
                  <p className={`text-xs font-semibold mt-1 leading-tight break-words ${c.off ? 'text-neutral-400' : 'text-neutral-900'}`}>
                    {c.staff.first_name} {c.staff.last_name}
                  </p>
                  <p className="text-[10px] text-neutral-400 truncate">
                    {formatPosition(c.staff.position)}
                    {c.off ? ' · Off' : ''}
                  </p>
                </div>
              ))}
            </div>

            {/* Body — time gutter + staff columns */}
            <div className="flex relative" style={{ height: totalHeight }}>
              {/* Time gutter (sticky left) */}
              <div
                className="sticky left-0 z-20 bg-white border-r border-neutral-200 shrink-0"
                style={{ width: GUTTER_W, minWidth: GUTTER_W }}
              >
                {gridlines.map((t, i) => {
                  const translate = i === 0 ? '' : i === gridlines.length - 1 ? '-translate-y-full' : '-translate-y-1/2';
                  return (
                    <span
                      key={t}
                      className={`absolute ${translate} text-xs font-medium text-neutral-600 whitespace-nowrap text-right pr-2`}
                      style={{ top: yPos(t), right: 0, left: 0 }}
                    >
                      {formatHour(t)}
                    </span>
                  );
                })}
              </div>

              {/* Staff columns */}
              {columns.map((c) => {
                const staffAppts = appointments.filter((a) => a.staff?.id === c.staff.id);
                const schedule = c.schedule;
                const breakTop = schedule?.break_start ? yPos(toMinutes(schedule.break_start)) : undefined;
                const breakH = schedule?.break_start && schedule?.break_end
                  ? durHeight(toMinutes(schedule.break_start), toMinutes(schedule.break_end))
                  : undefined;

                return (
                  <div
                    key={c.staff.id}
                    className={`relative flex-1 border-l border-neutral-200 ${c.off || !canBook ? 'bg-neutral-50/70' : 'group cursor-pointer'}`}
                    style={{ minWidth: COL_MIN_W, height: totalHeight }}
                    onClick={c.off || !canBook ? undefined : (e) => handleTrackClick(e, c.staff.id)}
                    onMouseMove={c.off || !canBook ? undefined : (e) => handleTrackMove(e, c.staff.id)}
                    onMouseLeave={c.off || !canBook ? undefined : handleTrackLeave}
                  >
                    {/* Horizontal gridlines */}
                    {gridlines.map((t) => (
                      <div
                        key={t}
                        className="absolute left-0 right-0 border-t border-neutral-100 pointer-events-none"
                        style={{ top: yPos(t) }}
                      />
                    ))}

                    {/* Past-time shading on today */}
                    {isToday && nowMin > viewStart && (
                      <div
                        className="absolute left-0 right-0 bg-neutral-200/50 pointer-events-none z-[5]"
                        style={{ top: 0, height: Math.max(yPos(nowMin) - yPos(viewStart), 0) }}
                      >
                        <span className="absolute top-1 right-2 text-[10px] font-medium text-neutral-500">Past</span>
                      </div>
                    )}

                    {/* Hover slot highlight */}
                    {canBook && !c.off && hoverSlot?.staffId === c.staff.id && hoverSlot.minutes + 30 <= viewEnd && !(isToday && hoverSlot.minutes < nowMin) && (
                      <div
                        className="absolute left-1 right-1 rounded-md bg-primary-500/10 border border-primary-400/50 pointer-events-none z-10 flex items-center justify-center"
                        style={{
                          top: yPos(hoverSlot.minutes),
                          height: durHeight(hoverSlot.minutes, hoverSlot.minutes + 30),
                          minHeight: 20,
                        }}
                      >
                        <span className="text-[10px] font-semibold text-primary-700 whitespace-nowrap px-1">
                          {formatHour(hoverSlot.minutes)} – {formatHour(hoverSlot.minutes + 30)}
                        </span>
                      </div>
                    )}

                    {/* Break shading */}
                    {!c.off && breakTop !== undefined && breakH !== undefined && (
                      <div
                        className="absolute left-1 right-1 rounded-md bg-amber-50/80 pointer-events-none z-0 flex items-center justify-center"
                        style={{ top: breakTop, height: breakH, minHeight: 20 }}
                      >
                        <span className="text-[10px] text-amber-600 font-medium">Break</span>
                      </div>
                    )}

                    {/* Appointments */}
                    {staffAppts.map((a) => {
                      const startMin = Math.max(toMinutes(a.start_time), viewStart);
                      const endMin = Math.min(toMinutes(a.end_time), viewEnd);
                      if (endMin <= startMin) return null;
                      const top = yPos(startMin);
                      const height = Math.max(durHeight(startMin, endMin), 20);
                      const serviceLabel = (a.services && a.services.length > 0)
                        ? a.services.map((s) => s.name).join(', ')
                        : a.service.name;
                      const editable = isBookingEditable(a.status);
                      const menuOpen = openMenu?.id === a.id;
                      const isSelected = selectedAppointmentId === a.id;
                      return (
                        <div
                          key={a.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(null);
                            onAppointmentClick(a);
                          }}
                          className={`absolute left-1 right-1 rounded-md px-1.5 py-1 text-left text-white overflow-hidden transition z-10 flex flex-col justify-between cursor-pointer ${statusBlockClass(a.status)}${
                            isSelected ? ' ring-2 ring-inset ring-white/80' : ''
                          }`}
                          style={{ top, height }}
                          title="Open appointment details"
                        >
                          <div>
                            <div className="flex items-start gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedCustomer(a.customer);
                                }}
                                className="font-semibold truncate text-[11px] leading-tight hover:underline text-left flex-1 text-white"
                                title="View complete patient clinical workspace"
                              >
                                {a.customer.first_name} {a.customer.last_name}
                              </button>
                              {editable ? (
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMenu(a, top, height);
                                  }}
                                  // The open menu dismisses on any outside mousedown.
                                  // Swallow it on the trigger itself, otherwise the
                                  // document handler would close the menu just before
                                  // this click re-opens it and the chevron could never
                                  // toggle it shut.
                                  onMouseDown={(e) => e.stopPropagation()}
                                  className="flex-shrink-0 -mt-0.5 -mr-0.5 p-0.5 rounded text-white/80 hover:bg-white/25 hover:text-white transition"
                                  title="Booking actions"
                                  aria-label={`Actions for ${a.customer.first_name} ${a.customer.last_name}`}
                                  aria-haspopup="menu"
                                  aria-expanded={menuOpen}
                                >
                                  <ChevronDown size={13} />
                                </button>
                              ) : (
                                <span className="flex-shrink-0"><CompletedLockBadge /></span>
                              )}
                            </div>
                            <p className="truncate text-[10px] leading-tight opacity-90">{a.start_time} – {a.end_time}</p>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenu(null);
                                onAppointmentClick(a);
                              }}
                              className={`truncate text-[10px] leading-tight opacity-90 hover:opacity-100 text-left underline w-full ${isSelected ? 'font-semibold' : ''}`}
                              title="Open appointment details"
                            >
                              {isSelected && <span className="inline-flex items-center"><Check size={11} className="inline mr-1 -mt-0.5" /></span>}
                              {serviceLabel}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Inline action menu — sibling of the blocks so the
                        `overflow-hidden` on a block cannot clip it. */}
                    {openMenu && openMenu.staffId === c.staff.id && (() => {
                      const a = appointments.find((x) => x.id === openMenu.id);
                      if (!a || !isBookingEditable(a.status)) return null;
                      return (
                        <div
                          ref={menuRef}
                          className="absolute left-1 right-1 z-40"
                          style={{ top: openMenu.top + openMenu.height + MENU_OFFSET }}
                          onClick={(e) => e.stopPropagation()}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <BookingBlockMenu
                            appointment={a}
                            staff={staff}
                            busyStatus={busyAppointmentId === a.id ? a.status : ''}
                            onStatus={onStatusChange}
                            onAssignStaff={onAssignStaff}
                            onAddService={onAddService}
                            onEdit={onEdit}
                            onDetails={onAppointmentClick}
                            onClose={() => setOpenMenu(null)}
                          />
                        </div>
                      );
                    })()}

                    {/* Off-day notice */}
                    {c.off && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <span className="text-xs text-neutral-400">Off / Unavailable</span>
                      </div>
                    )}

                    {/* Current time indicator */}
                    {showNow && (
                      <div
                        className="absolute left-0 right-0 border-t-2 border-red-400 z-20 pointer-events-none"
                        style={{ top: yPos(nowMin) }}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          </div>
        </>
      )}

      {/* Customer Detail Drawer — mounted once, not per appointment block. */}
      <CustomerDetailDrawer
        open={selectedCustomer !== null}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
      />
    </div>
  );
}

/** Legend swatches, derived from the shared status palette. */
const APPOINTMENT_LEGEND: Array<{ status: string; dot: string }> = Object.entries(
  APPOINTMENT_STATUS_META
).map(([status, meta]) => ({ status, dot: meta.dot }));
