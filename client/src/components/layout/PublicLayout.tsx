import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ChatbotWidget from '../chatbot/ChatbotWidget';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
];

export default function PublicLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user } = useAuth();
  const location = useLocation();

  const dashboardLink = user?.role === 'admin' ? '/admin' : user?.role === 'staff' ? '/staff' : '/customer';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-neutral-100 sticky top-0 z-50 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-1.5">
              <span className="text-xl font-display font-bold text-neutral-900 tracking-tight">Souvari</span>
              <span className="text-sm font-light text-neutral-400 hidden sm:block">Skin Lab</span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2 text-sm font-medium transition ${
                    location.pathname === link.to
                      ? 'text-neutral-900'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Desktop Right */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <Link to={dashboardLink} className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition px-3 py-2">
                  Dashboard
                </Link>
              ) : (
                <Link to="/login" className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition px-3 py-2">
                  Log in
                </Link>
              )}
              <Link to="/booking" className="btn-primary text-sm px-4 py-2">
                Book Appointment
              </Link>
            </div>

            {/* Mobile Hamburger */}
            <button className="md:hidden p-2 -mr-2" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-neutral-100 bg-white">
            <div className="px-4 py-4 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`block px-4 py-3 text-sm font-medium rounded-lg transition ${
                    location.pathname === link.to
                      ? 'text-neutral-900 bg-neutral-50'
                      : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="border-t border-neutral-100 mt-2 pt-2">
                {user ? (
                  <Link to={dashboardLink} onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-neutral-600 rounded-lg hover:bg-neutral-50">
                    Dashboard
                  </Link>
                ) : (
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-sm font-medium text-neutral-600 rounded-lg hover:bg-neutral-50">
                    Log in
                  </Link>
                )}
                <Link to="/booking" onClick={() => setMobileOpen(false)} className="block mt-2 text-center btn-primary text-sm">
                  Book Appointment
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-100 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <Link to="/" className="inline-block">
                <span className="text-xl font-display font-bold text-neutral-900">Souvari</span>
                <span className="block text-sm font-light text-neutral-400 mt-0.5">Skin Lab</span>
              </Link>
              <p className="text-sm text-neutral-500 mt-4 leading-relaxed">
                Premium aesthetic clinic offering advanced beauty treatments and personalized care.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-4">Quick Links</h4>
              <ul className="space-y-2.5 text-sm text-neutral-500">
                <li><Link to="/services" className="hover:text-neutral-900 transition">Services</Link></li>
                <li><Link to="/about" className="hover:text-neutral-900 transition">About</Link></li>
                <li><Link to="/booking" className="hover:text-neutral-900 transition">Book Appointment</Link></li>
                <li><Link to="/contact" className="hover:text-neutral-900 transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-4">Hours</h4>
              <ul className="space-y-2.5 text-sm text-neutral-500">
                <li>Mon – Fri: 9:00 AM – 6:00 PM</li>
                <li>Saturday: 9:00 AM – 5:00 PM</li>
                <li>Sunday: Closed</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-4">Contact</h4>
              <ul className="space-y-2.5 text-sm text-neutral-500">
                <li>123 Beauty Ave, Makati City</li>
                <li>Metro Manila, Philippines</li>
                <li>+63 917 123 4567</li>
                <li>souvariskinlab@gmail.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-100 mt-12 pt-8 text-center text-xs text-neutral-400">
            <p>&copy; {new Date().getFullYear()} Souvari Skin Lab. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Chatbot */}
      <ChatbotWidget />
    </div>
  );
}
