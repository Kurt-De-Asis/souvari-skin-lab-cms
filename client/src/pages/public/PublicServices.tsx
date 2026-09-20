import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { servicesApi } from '../../api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import Reveal from '../../components/ui/Reveal';
import formatCategory from '../../utils/formatCategory';

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
        const all: any[] = [];
        let page = 1;
        let totalPages = 1;
        do {
          const { data } = await servicesApi.browse({ page: String(page), limit: '100' });
          const result = data.data;
          const raw = result?.data || result?.items || result || [];
          totalPages = result?.pagination?.totalPages || 1;
          if (Array.isArray(raw)) {
            all.push(...raw.map((s: any) => ({
              ...s,
              price: Number(s.price) || 0,
              duration: Number(s.duration || s.duration_minutes) || 0,
            })));
          }
          page++;
        } while (page <= totalPages);
        setServices(all);
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
      <section className="bg-neutral-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-400">The menu</p>
            <h1 className="mt-5 text-4xl sm:text-5xl font-sans font-semibold leading-[1.1]">Services</h1>
            <p className="mt-4 text-neutral-300 max-w-2xl">
              Browse our aesthetic treatments and find the right service for you.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Content */}
      <section className="bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {/* Category Tabs */}
          {categories.length > 1 && (
            <div className="flex flex-wrap gap-x-8 gap-y-2 border-b border-neutral-200 mb-10">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`pb-3 text-xs font-semibold uppercase tracking-[0.2em] transition border-b ${
                    activeCategory === cat
                      ? 'border-primary-600 text-primary-700'
                      : 'border-transparent text-neutral-400 hover:text-neutral-900'
                  }`}
                >
                  {formatCategory(cat)}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <EmptyState title="No services found" description="No services available in this category." />
          ) : (
            <div className="border-t border-neutral-200">
              {filtered.map((service) => (
                <Link
                  key={service.id}
                  to={`/services/${service.id}`}
                  className="group flex items-center justify-between gap-6 py-6 border-b border-neutral-200 transition"
                >
                  <div className="min-w-0">
                    <h3 className="font-sans text-xl md:text-2xl text-neutral-900 group-hover:text-primary-700 transition">
                      {service.name}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-500 line-clamp-1 md:line-clamp-none">{service.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-400">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {service.duration} min</span>
                      <span className="text-neutral-300">·</span>
                      <span>{formatCategory(service.category)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 flex-shrink-0">
                    <span className="font-sans text-lg text-primary-700 whitespace-nowrap">₱{service.price.toLocaleString()}</span>
                    <ArrowRight size={18} className="text-neutral-300 transition group-hover:translate-x-1 group-hover:text-primary-600" />
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