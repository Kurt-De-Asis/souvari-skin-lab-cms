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
  paid?: boolean;
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
  payment?: { payment_method: string; amount_tendered?: number } | null;
}