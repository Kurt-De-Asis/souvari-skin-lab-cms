import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';
import { servicesApi } from '../../api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await servicesApi.browse();
        const raw = data.data || [];
        setServices((Array.isArray(raw) ? raw : []).slice(0, 6).map((s: any) => ({
          ...s,
          price: Number(s.price) || 0,
          duration: Number(s.duration || s.duration_minutes) || 0,
        })));
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  return (
    <div>
      {/* Hero */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="max-w-2xl">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-neutral-900 leading-[1.1] tracking-tight">
              Enhance Your Natural Beauty
            </h1>
            <p className="mt-6 text-lg text-neutral-500 leading-relaxed max-w-lg">
              Premium aesthetic treatments delivered by certified professionals. Personalized care in a welcoming environment.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link to="/booking" className="btn-primary px-7 py-3 text-sm">
                Book Appointment <ArrowRight size={16} />
              </Link>
              <Link to="/services" className="btn-secondary px-7 py-3 text-sm">
                Explore Services
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-neutral-100" />

      {/* Stats */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: '10,000+', label: 'Happy Clients' },
              { value: '15+', label: 'Years Experience' },
              { value: '50+', label: 'Services' },
              { value: '4.9', label: 'Average Rating' },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-display font-bold text-neutral-900">{s.value}</p>
                <p className="text-sm text-neutral-400 mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-neutral-100" />

      {/* Services */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">Our Services</h2>
              <p className="mt-2 text-neutral-500">Explore our range of aesthetic treatments.</p>
            </div>
            <Link to="/services" className="text-sm font-medium text-neutral-900 hover:text-neutral-600 transition hidden sm:flex items-center gap-1">
              View all <ArrowRight size={14} />
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {services.map((service) => (
                <Link
                  key={service.id}
                  to={`/services/${service.id}`}
                  className="group p-5 rounded-xl border border-neutral-200 hover:border-neutral-300 transition"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-base font-medium text-neutral-900 group-hover:text-neutral-700 transition">{service.name}</h3>
                    <span className="text-sm font-semibold text-neutral-900 ml-4 whitespace-nowrap">₱{service.price.toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-neutral-500 line-clamp-2 mb-3">{service.description}</p>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                    <Clock size={12} />
                    <span>{service.duration} min</span>
                    <span className="mx-1">·</span>
                    <span>{service.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 sm:hidden">
            <Link to="/services" className="btn-secondary w-full text-sm">
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-neutral-900">Why Choose Souvari Skin Lab</h2>
            <p className="mt-2 text-neutral-500">We deliver the highest standard of aesthetic care.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { title: 'Licensed Professionals', desc: 'Board-certified aestheticians and licensed medical professionals with years of experience.' },
              { title: 'Advanced Technology', desc: 'Latest FDA-approved equipment and premium products for safe and effective treatments.' },
              { title: 'Personalized Care', desc: 'Every treatment plan is tailored to your unique skin type, concerns, and beauty goals.' },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-xl border border-neutral-200 p-6">
                <h3 className="text-base font-semibold text-neutral-900">{f.title}</h3>
                <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900">Ready to Transform Your Look?</h2>
          <p className="mt-3 text-neutral-500 max-w-xl mx-auto">
            Schedule your consultation today and let our experts craft a personalized treatment plan for you.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link to="/booking" className="btn-primary px-7 py-3 text-sm">
              Book Appointment
            </Link>
            <Link to="/contact" className="btn-secondary px-7 py-3 text-sm">
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
