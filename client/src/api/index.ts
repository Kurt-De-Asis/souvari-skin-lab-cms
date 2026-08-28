import api from './axios';
export { setAccessToken } from './axios';

export const authApi = {
  register: (data: { email: string; password: string; first_name: string; last_name: string; phone?: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
};

export const customersApi = {
  list: (params?: Record<string, string>) => api.get('/customers', { params }),
  getById: (id: number) => api.get(`/customers/${id}`),
  getMe: () => api.get('/customers/me'),
  create: (data: any) => api.post('/customers', data),
  update: (id: number, data: any) => api.put(`/customers/${id}`, data),
  updateMe: (data: any) => api.put('/customers/me', data),
  delete: (id: number) => api.delete(`/customers/${id}`),
};

export const staffApi = {
  list: (params?: Record<string, string>) => api.get('/staff', { params }),
  getById: (id: number) => api.get(`/staff/${id}`),
  create: (data: any) => api.post('/staff', data),
  update: (id: number, data: any) => api.put(`/staff/${id}`, data),
  delete: (id: number) => api.delete(`/staff/${id}`),
  getSchedules: (id: number) => api.get(`/staff/${id}/schedules`),
  updateSchedules: (id: number, data: any) => api.put(`/staff/${id}/schedules`, data),
  getAvailability: (id: number, params: any) => api.get(`/staff/${id}/availability`, { params }),
};

export const servicesApi = {
  list: (params?: Record<string, string>) => api.get('/services', { params }),
  browse: (params?: Record<string, string>) => api.get('/services/browse', { params }),
  getById: (id: number) => api.get(`/services/${id}`),
  create: (data: any) => api.post('/services', data),
  update: (id: number, data: any) => api.put(`/services/${id}`, data),
  delete: (id: number) => api.delete(`/services/${id}`),
  assignStaff: (id: number, data: any) => api.post(`/services/${id}/staff`, data),
  removeStaff: (id: number, staffId: number) => api.delete(`/services/${id}/staff/${staffId}`),
  configureInventory: (id: number, data: any) => api.post(`/services/${id}/inventory`, data),
};

export const productsApi = {
  list: (params?: Record<string, string>) => api.get('/products', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  getMovements: (id: number, params?: any) => api.get(`/products/${id}/movements`, { params }),
  create: (data: any) => api.post('/products', data),
  update: (id: number, data: any) => api.put(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
  getLowStock: (params?: any) => api.get('/products/low-stock', { params }),
  adjustStock: (data: any) => api.post('/products/stock-adjustments', data),
  listCategories: () => api.get('/products/categories'),
  createCategory: (data: any) => api.post('/products/categories', data),
};

export const appointmentsApi = {
  list: (params?: Record<string, string>) => api.get('/appointments', { params }),
  getCalendar: (params: any) => api.get('/appointments/calendar', { params }),
  getAvailability: (params: any) => api.get('/appointments/availability', { params }),
  getQuote: (serviceId: number) => api.get('/appointments/quote', { params: { service_id: String(serviceId) } }),
  getById: (id: number) => api.get(`/appointments/${id}`),
  create: (data: any) => api.post('/appointments', data),
  updateStatus: (id: number, data: any) => api.patch(`/appointments/${id}/status`, data),
  update: (id: number, data: any) => api.patch(`/appointments/${id}`, data),
};

export const transactionsApi = {
  list: (params?: Record<string, string>) => api.get('/transactions', { params }),
  getById: (id: number) => api.get(`/transactions/${id}`),
  create: (data: any) => api.post('/transactions', data),
  void: (id: number, data?: any) => api.post(`/transactions/${id}/void`, data),
  refund: (id: number, data?: any) => api.post(`/transactions/${id}/refund`, data),
};

export const inventoryApi = {
  list: (params?: Record<string, string>) => api.get('/inventory', { params }),
  getLowStock: () => api.get('/inventory/low-stock'),
  adjust: (data: any) => api.post('/inventory/adjustments', data),
  recordPurchase: (data: any) => api.post('/inventory/purchase', data),
};

export const treatmentRecordsApi = {
  list: (params?: Record<string, string>) => api.get('/treatment-records', { params }),
  getById: (id: number) => api.get(`/treatment-records/${id}`),
  create: (data: any) => api.post('/treatment-records', data),
  update: (id: number, data: any) => api.put(`/treatment-records/${id}`, data),
};

export const notificationsApi = {
  list: (params?: Record<string, string>) => api.get('/notifications', { params }),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};

export const analyticsApi = {
  getDashboard: () => api.get('/analytics/dashboard'),
  getRevenue: (params?: any) => api.get('/analytics/revenue', { params }),
  getAppointments: (params?: any) => api.get('/analytics/appointments', { params }),
  getServices: (params?: any) => api.get('/analytics/services', { params }),
  getInventory: () => api.get('/analytics/inventory'),
};

export const chatApi = {
  send: (data: { message: string; session_token?: string }) => api.post('/chat', data),
};

export const settingsApi = {
  getAll: () => api.get('/settings'),
  getPublic: () => api.get('/settings/public'),
  update: (data: any) => api.put('/settings', data),
};

export const membershipPlansApi = {
  browse: (params?: Record<string, string>) => api.get('/membership-plans/browse', { params }),
  list: (params?: Record<string, string>) => api.get('/membership-plans', { params }),
  getById: (id: number) => api.get(`/membership-plans/${id}`),
  create: (data: any) => api.post('/membership-plans', data),
  update: (id: number, data: any) => api.put(`/membership-plans/${id}`, data),
  delete: (id: number) => api.delete(`/membership-plans/${id}`),
};

export const membershipsApi = {
  getMe: () => api.get('/memberships/me'),
  avail: (data: { plan_id: number; notes?: string }) => api.post('/memberships/avail', data),
  getById: (id: number) => api.get(`/memberships/${id}`),
  list: (params?: Record<string, string>) => api.get('/memberships', { params }),
  create: (data: any) => api.post('/memberships', data),
  updateStatus: (id: number, data: any) => api.put(`/memberships/${id}/status`, data),
  extend: (id: number, data: any) => api.put(`/memberships/${id}/extend`, data),
  validateCode: (code: string) => api.get(`/memberships/validate/${code}`),
};

export const loyaltyApi = {
  getProgress: (membershipId: number) => api.get(`/loyalty/progress/${membershipId}`),
  listMilestones: (params?: Record<string, string>) => api.get('/loyalty/milestones', { params }),
  createMilestone: (data: any) => api.post('/loyalty/milestones', data),
  updateMilestone: (id: number, data: any) => api.put(`/loyalty/milestones/${id}`, data),
  deleteMilestone: (id: number) => api.delete(`/loyalty/milestones/${id}`),
  adjustSpend: (data: any) => api.post('/loyalty/adjust', data),
  recalculate: (membershipId: number) => api.post(`/loyalty/recalculate/${membershipId}`),
};

export const referralsApi = {
  create: (data: any) => api.post('/referrals', data),
  getMe: () => api.get('/referrals/me'),
  getBalance: () => api.get('/referrals/balance'),
  list: (params?: Record<string, string>) => api.get('/referrals/admin', { params }),
  getById: (id: number) => api.get(`/referrals/admin/${id}`),
  approve: (id: number, data: any) => api.put(`/referrals/admin/${id}/approve`, data),
};

export const monthlyPerksApi = {
  getMe: () => api.get('/monthly-perks/me'),
  use: (data: any) => api.post('/monthly-perks/use', data),
  list: (params?: Record<string, string>) => api.get('/monthly-perks/admin', { params }),
  reset: (data: any) => api.post('/monthly-perks/admin/reset', data),
};

export const membershipGiftsApi = {
  create: (data: any) => api.post('/membership-gifts', data),
  getMe: () => api.get('/membership-gifts/me'),
  list: (params?: Record<string, string>) => api.get('/membership-gifts/admin', { params }),
  getById: (id: number) => api.get(`/membership-gifts/admin/${id}`),
  approve: (id: number, data: any) => api.put(`/membership-gifts/admin/${id}/approve`, data),
  redeem: (id: number) => api.put(`/membership-gifts/admin/${id}/redeem`),
};

export const servicePricesApi = {
  list: (params?: Record<string, string>) => api.get('/service-prices', { params }),
  getMatrix: (params?: Record<string, string>) => api.get('/service-prices/matrix', { params }),
  update: (id: number, data: any) => api.put(`/service-prices/${id}`, data),
  bulkUpdate: (updates: any[]) => api.post('/service-prices/bulk-update', { updates }),
};

export const servicePackagesApi = {
  list: (params?: Record<string, string>) => api.get('/service-packages', { params }),
  getById: (id: number) => api.get(`/service-packages/${id}`),
  create: (data: any) => api.post('/service-packages', data),
  update: (id: number, data: any) => api.put(`/service-packages/${id}`, data),
  remove: (id: number) => api.delete(`/service-packages/${id}`),
};

export const membershipFamiliesApi = {
  list: (params?: Record<string, string>) => api.get('/membership-families', { params }),
  getById: (id: number) => api.get(`/membership-families/${id}`),
  getByCode: (code: string) => api.get(`/membership-families/code/${code}`),
  create: (data: any) => api.post('/membership-families', data),
  update: (id: number, data: any) => api.put(`/membership-families/${id}`, data),
};

export const serviceCategoriesApi = {
  list: (params?: Record<string, string>) => api.get('/service-categories', { params }),
  getById: (id: number) => api.get(`/service-categories/${id}`),
  create: (data: any) => api.post('/service-categories', data),
  update: (id: number, data: any) => api.put(`/service-categories/${id}`, data),
  remove: (id: number) => api.delete(`/service-categories/${id}`),
};

export const resourcesApi = {
  list: (params?: Record<string, string>) => api.get('/resources', { params }),
  getById: (id: number) => api.get(`/resources/${id}`),
  create: (data: any) => api.post('/resources', data),
  update: (id: number, data: any) => api.put(`/resources/${id}`, data),
  remove: (id: number) => api.delete(`/resources/${id}`),
  getServiceResources: (serviceId: number) => api.get(`/resources/service/${serviceId}`),
  assignToService: (serviceId: number, data: any) => api.post(`/resources/service/${serviceId}`, data),
};

export const serviceAddonsApi = {
  list: (params?: Record<string, string>) => api.get('/service-addons', { params }),
  getById: (id: number) => api.get(`/service-addons/${id}`),
  create: (data: any) => api.post('/service-addons', data),
  update: (id: number, data: any) => api.put(`/service-addons/${id}`, data),
  remove: (id: number) => api.delete(`/service-addons/${id}`),
};
