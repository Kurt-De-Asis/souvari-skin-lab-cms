import { Outlet, Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { Menu, X, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ChatbotWidget from '../chatbot/ChatbotWidget';
import Transition from '../ui/Transition';

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
      <nav className="border-b border-neutral-800 sticky top-0 z-50 bg-neutral-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-between h-20">
            {/* Left Nav Links */}
            <div className="hidden md:flex items-center gap-8 z-10">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`text-xs font-medium uppercase tracking-[0.2em] transition ${
                    location.pathname === link.to
                      ? 'text-primary-400'
                      : 'text-neutral-400 hover:text-primary-300'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Centered Logo (desktop only — mobile row below renders its own) */}
            <div className="hidden md:block absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
              <Link to="/" className="flex items-center">
                <img src="/images/souvari-logo.png" alt="Souvari Skin Lab" className="h-10 sm:h-12 w-auto object-contain" />
              </Link>
            </div>

            {/* Right Actions */}
            <div className="hidden md:flex items-center gap-6 z-10 ml-auto">
              {user ? (
                <Link to={dashboardLink} className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition">
                  Dashboard
                </Link>
              ) : (
                <Link to="/login" className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400 hover:text-white transition">
                  Sign in
                </Link>
              )}
              <Link to="/booking" className="inline-flex items-center gap-2 bg-primary-500 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-white rounded-md transition hover:bg-primary-600">
                Book a Consultation
                <ArrowRight size={14} />
              </Link>
            </div>

            {/* Mobile Hamburger & Logo */}
            <div className="flex md:hidden items-center justify-between w-full">
              <button className="p-2 text-neutral-300" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu">
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
              <Link to="/" className="absolute left-1/2 -translate-x-1/2">
<img src="/images/souvari-logo.png" alt="Souvari Skin Lab" className="h-9 w-auto object-contain" />
                </Link>
              <div className="w-8" />
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <Transition show={mobileOpen} duration={200}>
          {({ active }) => (
            <div className={`md:hidden border-t border-neutral-800 bg-neutral-900 ${active ? 'anim-slide-in-down' : 'anim-slide-out-up'}`}>
              <div className="px-4 py-4 space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-3 text-xs font-medium uppercase tracking-[0.2em] transition ${
                      location.pathname === link.to
                        ? 'text-primary-400 bg-neutral-800'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
                <div className="border-t border-neutral-800 mt-2 pt-2">
                  {user ? (
                    <Link to={dashboardLink} onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-xs font-medium uppercase tracking-[0.2em] text-neutral-300 hover:text-white">
                      Dashboard
                    </Link>
                  ) : (
                    <Link to="/login" onClick={() => setMobileOpen(false)} className="block px-4 py-3 text-xs font-medium uppercase tracking-[0.2em] text-neutral-300 hover:text-white">
                      Sign in
                    </Link>
                  )}
                  <Link to="/booking" onClick={() => setMobileOpen(false)} className="mt-3 flex items-center justify-center gap-2 bg-primary-500 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white rounded-md">
                    Book a Consultation
                  </Link>
                </div>
              </div>
            </div>
          )}
        </Transition>
      </nav>

      <main className="flex-1">
        <div key={location.pathname} className="anim-page-enter">
          <Outlet />
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-800 bg-neutral-900 text-neutral-400 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-32 sm:pb-24">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-1">
              <Link to="/" className="inline-block">
                <img src="/images/souvari-logo.png" alt="Souvari Skin Lab" className="h-12 w-auto object-contain" />
              </Link>
              <p className="text-sm text-neutral-400 mt-5 leading-relaxed">
                Premium aesthetic clinic offering advanced beauty treatments and personalized care.
              </p>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-100 mb-5">Explore</h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li><Link to="/services" className="hover:text-primary-400 transition">Services</Link></li>
                <li><Link to="/about" className="hover:text-primary-400 transition">About</Link></li>
                <li><Link to="/booking" className="hover:text-primary-400 transition">Book a Consultation</Link></li>
                <li><Link to="/contact" className="hover:text-primary-400 transition">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-100 mb-5">Hours</h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li>Mon – Fri: 9:00 AM – 6:00 PM</li>
                <li>Saturday: 9:00 AM – 5:00 PM</li>
                <li>Sunday: Closed</li>
              </ul>
            </div>
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-100 mb-5">Contact</h4>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li>2nd Floor, The District Dasmariñas</li>
                <li>Molino-Paliparan Rd., Dasmariñas, Cavite</li>
                <li>0981-689-9909</li>
                <li>souvariskinlab@gmail.com</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-neutral-800 mt-14 pt-8 text-center text-xs text-neutral-500">
            <p>&copy; {new Date().getFullYear()} Souvari Skin Lab. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Floating Chatbot */}
      <ChatbotWidget />
    </div>
  );
}