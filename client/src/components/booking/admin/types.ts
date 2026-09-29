export interface BookingAppointment {
  id: number;
  date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string | null;
  customer: { id: number; first_name: string; last_name: string };
  staff: { id: number; first_name: string; last_name: string };
  service: { id: number; name: string };
  services?: { id: number; name: string; price?: number; duration_minutes?: number }[];
  /** True when nothing is outstanding. Kept for existing call sites. */
  paid?: boolean;
  /** Quote after membership/perk, less the manual staff discount. */
  amount_due?: number;
  paid_amount?: number;
  /** amount_due - paid_amount. Positive means the booking is part-paid. */
  balance?: number;
  discount_pct?: number | null;
}

export interface BalanceService {
  service_id: number;
  name: string;
  price: number;
  already_covered: boolean;
  line_total?: number;
}

export interface AppointmentBalance {
  appointment_id: number;
  status: string;
  quoted_total: number;
  discount_pct: number;
  discount_reason: string | null;
  amount_due: number;
  paid_amount: number;
  balance: number;
  /** Services already billed; never charged again. */
  covered_services: BalanceService[];
  /** Services still to pay for, apportioned with the booking's discount. */
  uncovered_services: BalanceService[];
  has_balance: boolean;
}

export interface StaffSchedule {
  day_of_week: string;
  start_time: string;
  end_time: string;
  break_start?: string | null;
  break_end?: string | null;
  is_active: boolean;
}

export interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  position?: string;
  status?: string;
  avatar_url?: string | null;
  schedules?: StaffSchedule[];
}

export interface ServiceOption {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  duration: number;
  category: string;
  category_name?: string;
  staff: { id: number; first_name: string; last_name: string; position?: string }[];
}

export interface CustomerOption {
  id: number;
  first_name: string;
  last_name: string;
  user?: { email?: string; phone?: string | null };
}

export interface TimeSlot {
  start: string;
  end: string;
  staff_id: number;
  staff_name?: string;
}

export interface CreateAppointmentPayload {
  customer_id: number;
  service_id: number;
  staff_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  notes?: string;
}

export interface WalkInCustomerPayload {
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CreateGroupAppointmentPayload {
  customer_id?: number;
  walk_in?: WalkInCustomerPayload;
  service_ids: number[];
  staff_id: number;
  appointment_date: string;
  start_time: string;
  notes?: string;
}
