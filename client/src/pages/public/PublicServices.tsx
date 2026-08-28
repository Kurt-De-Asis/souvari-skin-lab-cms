import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { servicesApi } from '../../api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
}

export default function PublicServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await servicesApi.browse();
        const raw = data.data || [];
        setServices((Array.isArray(raw) ? raw : []).map((s: any) => ({
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

  const categories = useMemo(() => {
    const cats = [...new Set(services.map((s) => s.category))];
    return ['All', ...cats];
  }, [services]);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return services;
    return services.filter((s) => s.category === activeCategory);
  }, [services, activeCategory]);

  return (
    <div>
      {/* Header */}
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-semibold text-neutral-900">Services</h1>
          <p className="mt-2 text-neutral-500">Browse our aesthetic treatments and find the right service for you.</p>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Category Pills */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                    activeCategory === cat
                      ? 'bg-neutral-900 text-white'
                      : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-300 hover:text-neutral-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <LoadingSpinner />
          ) : filtered.length === 0 ? (
            <EmptyState title="No services found" description="No services available in this category." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((service) => (
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs text-neutral-400">
                      <Clock size={12} />
                      <span>{service.duration} min</span>
                      <span className="mx-1">·</span>
                      <span>{service.category}</span>
                    </div>
                    <ArrowRight size={14} className="text-neutral-300 group-hover:text-neutral-600 transition" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
