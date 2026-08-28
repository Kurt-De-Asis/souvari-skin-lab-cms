import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Calendar, Users, UserCog, Scissors, Package, ShoppingCart,
  ClipboardList, BarChart3, Settings, Bell, Menu, X, LogOut, ChevronDown,
  MessageSquare, Clock, BoxesIcon, FileText, Crown, Award, GitPullRequest,
  BookOpen, DollarSign, Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../api';

const adminNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/admin/appointments', icon: ClipboardList, label: 'Appointments' },
  { to: '/admin/calendar', icon: Calendar, label: 'Calendar' },
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { to: '/admin/staff', icon: UserCog, label: 'Staff' },
  { to: '/admin/services', icon: Scissors, label: 'Services' },
  { to: '/admin/catalog', icon: BookOpen, label: 'Service Catalog' },
  { to: '/admin/pricing-matrix', icon: DollarSign, label: 'Pricing Matrix' },
  { to: '/admin/packages', icon: Layers, label: 'Session Packages' },
  { to: '/admin/products', icon: Package, label: 'Products' },
  { to: '/admin/inventory', icon: BoxesIcon, label: 'Inventory' },
  { to: '/admin/transactions', icon: ShoppingCart, label: 'Transactions' },
  { to: '/admin/membership-plans', icon: Crown, label: 'Membership Plans' },
  { to: '/admin/memberships', icon: Award, label: 'Memberships' },
  { to: '/admin/referrals', icon: GitPullRequest, label: 'Referrals' },
  { to: '/admin/membership-families', icon: Crown, label: 'Membership Families' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const staffNav = [
  { to: '/staff', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/staff/appointments', icon: ClipboardList, label: 'Appointments' },
  { to: '/staff/schedule', icon: Clock, label: 'My Schedule' },
  { to: '/staff/notifications', icon: Bell, label: 'Notifications' },
];

const customerNav = [
  { to: '/customer', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/customer/book', icon: Calendar, label: 'Book Appointment' },
  { to: '/customer/appointments', icon: ClipboardList, label: 'My Appointments' },
  { to: '/customer/history', icon: FileText, label: 'Treatment History' },
  { to: '/customer/transactions', icon: ShoppingCart, label: 'Transactions' },
  { to: '/customer/membership', icon: Award, label: 'My Membership' },
  { to: '/customer/privileges', icon: Crown, label: 'Platinum Privileges' },
  { to: '/customer/notifications', icon: Bell, label: 'Notifications' },
  { to: '/customer/chat', icon: MessageSquare, label: 'AI Assistant' },
  { to: '/customer/profile', icon: UserCog, label: 'Profile' },
];

export default function DashboardLayout({ role }: { role: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const nav = role === 'admin' ? adminNav : role === 'staff' ? staffNav : customerNav;
  const publicLink = '/';

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await notificationsApi.getUnreadCount();
        setUnreadCount(data.data?.count || 0);
      } catch {}
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const userName = user?.role === 'customer' && user.customer
    ? `${user.customer.first_name} ${user.customer.last_name}`
    : user?.role === 'staff' && user.staff
    ? `${user.staff.first_name} ${user.staff.last_name}`
    : user?.email || 'User';

  const roleLabel = role === 'admin' ? 'Administrator' : role === 'staff' ? 'Staff' : 'Customer';

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Sidebar */}
      <aside className={`bg-neutral-900 text-white transition-all duration-200 flex flex-col ${
        sidebarOpen ? 'w-64' : 'w-16'
      } hidden lg:flex`}>
        <div className="p-4 flex items-center gap-2">
          <Link to={publicLink} className="text-xl font-display font-bold text-primary-400">Souvari Skin Lab</Link>
          {sidebarOpen && <span className="text-xs text-neutral-400 mt-1">{roleLabel}</span>}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1">
          {nav.map((item) => {
            const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to) && location.pathname !== item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                }`}
                title={item.label}
              >
                <item.icon size={18} />
                {sidebarOpen && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-3 text-neutral-400 hover:text-white border-t border-neutral-800"
        >
          <ChevronDown size={18} className={`transition-transform ${sidebarOpen ? '' : '-rotate-90'}`} />
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-neutral-900 text-white p-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-display font-bold text-primary-400">Souvari Skin Lab</span>
              <button onClick={() => setMobileOpen(false)}><X size={20} /></button>
            </div>
            <nav className="space-y-1">
              {nav.map((item) => {
                const isActive = item.end ? location.pathname === item.to : location.pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive ? 'bg-primary-600 text-white' : 'text-neutral-400 hover:bg-neutral-800'
                    }`}
                  >
                    <item.icon size={18} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
          <button className="lg:hidden p-2" onClick={() => setMobileOpen(true)}>
            <Menu size={24} />
          </button>

          <div className="hidden lg:block">
            <h1 className="text-lg font-semibold text-neutral-900 capitalize">
              {nav.find(n => n.end ? location.pathname === n.to : location.pathname.startsWith(n.to))?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link to={`/${role}/notifications`} className="relative p-2 text-neutral-500 hover:text-neutral-700">
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-700">{userName.charAt(0)}</span>
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-medium text-neutral-900">{userName}</p>
                <p className="text-xs text-neutral-500">{roleLabel}</p>
              </div>
            </div>

            <button onClick={handleLogout} className="p-2 text-neutral-500 hover:text-red-600" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
