import type { StaffMember, StaffSchedule } from '../components/booking/admin/types';

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

export function weekdayOf(date: string): string {
  return WEEKDAYS[new Date(`${date}T00:00:00`).getDay()];
}

export function scheduleForWeekday(staff: StaffMember, date: string): StaffSchedule | undefined {
  const weekday = weekdayOf(date);
  return staff.schedules?.find((s) => s.day_of_week === weekday);
}

/**
 * Whether a specialist is scheduled (and therefore bookable) on a given date.
 * Mirrors the server's availability rules: a member with no schedule entry for
 * the weekday, an inactive entry, or an explicit off-day (00:00-00:00) is off.
 *
 * If the staff record carries no schedule data at all (API did not include it),
 * fall back to "available" so callers never under-filter unexpectedly — the
 * server is the authoritative guard.
 */
export function staffWorksOnDate(staff: StaffMember, date: string): boolean {
  if (!Array.isArray(staff.schedules)) return true;
  const schedule = staff.schedules.find((s) => s.day_of_week === weekdayOf(date));
  if (!schedule) return false;
  if (!schedule.is_active) return false;
  return !(schedule.start_time === '00:00' && schedule.end_time === '00:00');
}