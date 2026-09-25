import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import {
  LayoutDashboard, Calendar, CalendarDays, Users, UserCog, Scissors, Package, ShoppingCart,
  ClipboardList, BarChart3, Settings, Bell, Menu, X, LogOut, ChevronDown,
  ChevronRight, MessageSquare, Clock, BoxesIcon, Crown, Award,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../api';
import Transition from '../ui/Transition';

type NavItem = { to: string; icon: any; label: string; end?: boolean };
type NavGroup = { icon: any; label: string; children: NavItem[] };
type NavEntry = NavItem | NavGroup;

const isGroup = (item: NavEntry): item is NavGroup => 'children' in item;

const adminNav: NavEntry[] = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { icon: Calendar, label: 'Bookings', children: [
    { to: '/admin/calendar', icon: CalendarDays, label: 'Calendar' },
    { to: '/admin/appointments', icon: ClipboardList, label: 'Appointments' },
  ]},
  { icon: UserCog, label: 'Team', children: [
    { to: '/admin/staff', icon: UserCog, label: 'Team Members' },
    { to: '/admin/shifts', icon: Calendar, label: 'Scheduled Shifts' },
  ]},
  { to: '/admin/customers', icon: Users, label: 'Customers' },
  { icon: Scissors, label: 'Services', children: [
    { to: '/admin/services', icon: Scissors, label: 'Services' },
    { to: '/admin/packages', icon: Layers, label: 'Session Packages' },
  ]},
  { icon: Package, label: 'Products & Inventory', children: [
    { to: '/admin/products', icon: Package, label: 'Products' },
    { to: '/admin/inventory', icon: BoxesIcon, label: 'Inventory' },
  ]},
  { icon: BarChart3, label: 'Reports', children: [
    { to: '/admin/transactions', icon: ShoppingCart, label: 'Transactions' },
    { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  ]},
  { icon: Crown, label: 'Memberships', children: [
    { to: '/admin/membership-plans', icon: Crown, label: 'Membership Plans' },
    { to: '/admin/memberships', icon: Award, label: 'Memberships' },
  ]},
  { icon: Settings, label: 'System', children: [
    { to: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { to: '/admin/settings', icon: Settings, label: 'Settings' },
  ]},
];

const staffNav: NavEntry[] = [
  { to: '/staff', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/staff/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/staff/appointments', icon: ClipboardList, label: 'Appointments' },
  { to: '/staff/schedule', icon: Clock, label: 'My Schedule' },
  { to: '/staff/memberships', icon: Award, label: 'Memberships' },
  { to: '/staff/products', icon: Package, label: 'Products & POS' },
  { to: '/staff/notifications', icon: Bell, label: 'Notifications' },
];

function customerNav(): NavEntry[] {
  return [
    { to: '/customer', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/customer/book', icon: Calendar, label: 'Book Appointment' },
    { to: '/customer/appointments', icon: ClipboardList, label: 'My Appointments' },
    { to: '/customer/transactions', icon: ShoppingCart, label: 'Transactions' },
    { to: '/customer/membership', icon: Award, label: 'My Membership' },
    { to: '/customer/notifications', icon: Bell, label: 'Notifications' },
    { to: '/customer/chat', icon: MessageSquare, label: 'AI Assistant' },
  ];
}

/** Flatten all leaf NavItems (for header title lookup). */
function flattenNav(items: NavEntry[]): NavItem[] {
  return items.flatMap((item) => (isGroup(item) ? item.children : [item]));
}

/** Check if a NavItem matches the current path. */
function isActiveItem(item: NavItem, pathname: string): boolean {
  if (item.end) return pathname === item.to;
  return pathname === item.to || pathname.startsWith(`${item.to}/`);
}

/** Return the labels of all groups whose children contain an active item. */
function activeGroupLabels(nav: NavEntry[], pathname: string): Set<string> {
  const labels = new Set<string>();
  for (const item of nav) {
    if (isGroup(item) && item.children.some((child) => isActiveItem(child, pathname))) {
      labels.add(item.label);
    }
  }
  return labels;
}

export default function DashboardLayout({ role }: { role: string }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const nav = useMemo(() => {
    if (role === 'admin') return adminNav;
    if (role === 'staff') return staffNav;
    return customerNav();
  }, [role]);
  const publicLink = '/';
  const flatNav = useMemo(() => flattenNav(nav), [nav]);

  // Auto-expand groups that contain the active route.
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => activeGroupLabels(nav, location.pathname));
  useEffect(() => {
    setExpandedGroups((prev) => {
      const active = activeGroupLabels(nav, location.pathname);
      return new Set([...prev, ...active]);
    });
  }, [location.pathname, nav]);

  const toggleGroup = (label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label); else next.add(label);
      return next;
    });
  };

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

  const activePageLabel = flatNav.find((item) => isActiveItem(item, location.pathname))?.label || 'Dashboard';

  /** Render a single leaf NavItem as a <Link>. */
  const renderLeaf = (item: NavItem, opts?: { indent?: boolean; onNavigate?: () => void }) => {
    const active = isActiveItem(item, location.pathname);
    return (
      <Link
        key={item.to}
        to={item.to}
        onClick={opts?.onNavigate}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition ${
          opts?.indent ? 'pl-9' : ''
        } ${
          active
            ? 'bg-primary-500 text-white'
            : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900'
        }`}
        title={item.label}
      >
        <item.icon size={18} />
        {sidebarOpen && <span>{item.label}</span>}
      </Link>
    );
  };

  /** Render a collapsible group (admin only). */
  const renderGroup = (group: NavGroup, onNavigate?: () => void) => {
    const expanded = expandedGroups.has(group.label);
    const groupHasActive = group.children.some((child) => isActiveItem(child, location.pathname));
    const GroupIcon = group.icon;

    return (
      <div key={group.label}>
        <button
          onClick={() => toggleGroup(group.label)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition ${
            groupHasActive
              ? 'text-white'
              : 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900'
          }`}
          title={group.label}
        >
          <GroupIcon size={18} />
          {sidebarOpen && (
            <>
              <span className="flex-1 text-left">{group.label}</span>
              {expanded
                ? <ChevronDown size={14} className="text-neutral-500" />
                : <ChevronRight size={14} className="text-neutral-500" />}
            </>
          )}
        </button>
        <div
          className={`grid overflow-hidden transition-[grid-template-rows] duration-300 ease-smooth ${
            sidebarOpen && expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={`space-y-0.5 mt-0.5 transition-opacity duration-200 ease-smooth ${
                sidebarOpen && expanded ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {group.children.map((child) => renderLeaf(child, { indent: true, onNavigate }))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  /** Render a single nav entry (leaf or group). */
  const renderNavEntry = (item: NavEntry, onNavigate?: () => void) => {
    if (isGroup(item)) return renderGroup(item, onNavigate);
    return renderLeaf(item, { onNavigate });
  };

  return (
    <div className="h-screen overflow-hidden flex bg-neutral-50">
      {/* Sidebar */}
      <aside className={`bg-neutral-900 text-white transition-all duration-300 ease-smooth flex flex-col relative ${
        sidebarOpen ? 'w-64' : 'w-16'
      } hidden md:flex`}>
        <div className="p-4 overflow-hidden">
          <Link to={publicLink} title="Souvari Skin Lab" className="block whitespace-nowrap transition-all">
            {sidebarOpen
              ? <img src="/images/souvari-logo.png" alt="Souvari Skin Lab" className="h-8 w-auto object-contain" />
              : <img src="/images/souvari-logo.png" alt="Souvari Skin Lab" className="h-7 w-auto object-contain" />}
          </Link>
          {sidebarOpen && <span className="block text-xs text-neutral-400 mt-2">{roleLabel}</span>}
        </div>

        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {nav.map((item) => renderNavEntry(item))}
        </nav>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute top-1/2 -translate-y-1/2 right-[-10px] w-6 h-6 rounded-full bg-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-700 border border-neutral-700 flex items-center justify-center  z-10"
          title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          <ChevronRight size={14} className={`transition-transform ${sidebarOpen ? 'rotate-180' : ''}`} />
        </button>
      </aside>

      {/* Mobile sidebar overlay */}
      <Transition show={mobileOpen} duration={250}>
        {({ active }) => (
          <div className="fixed inset-0 z-50 md:hidden">
            <div
              className={`absolute inset-0 bg-black/50 ${active ? 'anim-fade-in' : 'anim-fade-out'}`}
              onClick={() => setMobileOpen(false)}
            />
            <aside
              className={`absolute left-0 top-0 bottom-0 w-64 bg-neutral-900 text-white p-4 overflow-y-auto ${
                active ? 'anim-slide-in-left' : 'anim-slide-out-left'
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <img src="/images/souvari-logo.png" alt="Souvari Skin Lab" className="h-8 w-auto object-contain" />
                  <span className="block text-xs text-neutral-400 mt-2">{roleLabel}</span>
                </div>
                <button onClick={() => setMobileOpen(false)}><X size={20} /></button>
              </div>
              <nav className="space-y-1">
                {nav.map((item) => renderNavEntry(item, () => setMobileOpen(false)))}
              </nav>
            </aside>
          </div>
        )}
      </Transition>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-neutral-200 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-40">
          <button className="md:hidden p-2" onClick={() => setMobileOpen(true)}>
            <Menu size={24} />
          </button>

          <div className="hidden md:block">
            <h1 className="text-lg font-semibold text-neutral-900">{activePageLabel}</h1>
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

            {role === 'customer' ? (
              <Link to="/customer/profile" className="flex items-center gap-2 rounded-md hover:bg-neutral-50 p-1.5 transition" title="View profile">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-700">{userName.charAt(0)}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-neutral-900">{userName}</p>
                  <p className="text-xs text-neutral-500">{roleLabel}</p>
                </div>
              </Link>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-semibold text-primary-700">{userName.charAt(0)}</span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium text-neutral-900">{userName}</p>
                  <p className="text-xs text-neutral-500">{roleLabel}</p>
                </div>
              </div>
            )}

            <button onClick={handleLogout} className="p-2 text-neutral-500 hover:text-red-600" title="Logout">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
          <div key={location.pathname} className="anim-page-enter">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
