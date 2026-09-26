import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { servicesApi } from '../../api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import Reveal from '../../components/ui/Reveal';
import { formatServicePrice } from '../../utils/format';
import formatCategory from '../../utils/formatCategory';

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  category_name?: string;
  group?: { display_order: number } | null;
}

const PREVIEW_PER_CATEGORY = 6;

const groupKey = (s: Service): string => s.category_name || s.category;

interface Category {
  key: string;
  count: number;
  order: number;
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

  const categories = useMemo<Category[]>(() => {
    const byKey = new Map<string, Category>();
    for (const s of services) {
      const key = groupKey(s);
      const existing = byKey.get(key);
      if (existing) existing.count++;
      else byKey.set(key, { key, count: 1, order: s.group?.display_order ?? 999 });
    }
    return [...byKey.values()].sort((a, b) => a.order - b.order);
  }, [services]);

  const filtered = useMemo(() => {
    if (activeCategory === 'All') return services;
    return services.filter((s) => groupKey(s) === activeCategory);
  }, [services, activeCategory]);

  const grouped = useMemo(() => {
    if (activeCategory !== 'All') return [];
    const byKey = new Map<string, Service[]>();
    for (const s of services) {
      const key = groupKey(s);
      if (!byKey.has(key)) byKey.set(key, []);
      byKey.get(key)!.push(s);
    }
    return [...byKey.entries()]
      .map(([key, list]) => ({ key, list, order: list[0]?.group?.display_order ?? 999 }))
      .sort((a, b) => a.order - b.order);
  }, [services, activeCategory]);

  const selectCategory = (key: string) => {
    setActiveCategory(key);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const freeConsultation = useMemo<Service | undefined>(
    () => services.find((s) => s.category === 'consultation' && Number(s.price) === 0),
    [services],
  );

  const renderConsultationRow = () => {
    if (!freeConsultation) return null;
    return (
      <Link
        key={`free-consultation-${freeConsultation.id}`}
        to={`/services/${freeConsultation.id}`}
        className="group flex items-center justify-between gap-6 py-5 border-b border-primary-200 bg-primary-50/60 px-4 sm:px-6 transition hover:bg-primary-50"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary-700 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5">
              Free
            </span>
            <span className="rounded-full bg-primary-100 text-primary-800 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5">
              Recommended for New Clients
            </span>
          </div>
          <h3 className="mt-1.5 font-sans text-lg md:text-xl text-neutral-900 group-hover:text-primary-700 transition">
            {freeConsultation.name}
          </h3>
          {freeConsultation.description && (
            <p className="mt-0.5 text-sm text-neutral-500 line-clamp-1 md:line-clamp-2">{freeConsultation.description}</p>
          )}
          <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-400">
            <span className="flex items-center gap-1"><Clock size={11} /> {freeConsultation.duration} min</span>
          </div>
        </div>
        <div className="flex items-center gap-4 flex-shrink-0">
          <span className="font-sans text-lg text-primary-700 whitespace-nowrap">{formatServicePrice(freeConsultation.price)}</span>
          <ArrowRight size={18} className="text-neutral-300 transition group-hover:translate-x-1 group-hover:text-primary-600" />
        </div>
      </Link>
    );
  };

  const renderRow = (service: Service) => (
    <Link
      key={service.id}
      to={`/services/${service.id}`}
      className="group flex items-center justify-between gap-6 py-5 border-b border-neutral-200 bg-white px-4 sm:px-6 transition hover:bg-neutral-50"
    >
      <div className="min-w-0">
        <h3 className="font-sans text-lg md:text-xl text-neutral-900 group-hover:text-primary-700 transition">
          {service.name}
        </h3>
        {service.description && (
          <p className="mt-0.5 text-sm text-neutral-500 line-clamp-1 md:line-clamp-2">{service.description}</p>
        )}
        <div className="mt-1.5 flex items-center gap-2 text-xs text-neutral-400">
          <span className="flex items-center gap-1"><Clock size={11} /> {service.duration} min</span>
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="font-sans text-lg text-primary-700 whitespace-nowrap">{formatServicePrice(service.price)}</span>
        <ArrowRight size={18} className="text-neutral-300 transition group-hover:translate-x-1 group-hover:text-primary-600" />
      </div>
    </Link>
  );

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

      {/* Sticky category filter */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-20 bg-neutral-50/95 backdrop-blur border-b border-neutral-200">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex gap-2 overflow-x-auto scrollbar-hide md:overflow-x-visible md:flex-wrap">
            <button
              onClick={() => selectCategory('All')}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                activeCategory === 'All'
                  ? 'bg-neutral-900 text-white'
                  : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400'
              }`}
            >
              All
              <span className={`ml-1.5 text-xs ${activeCategory === 'All' ? 'text-neutral-300' : 'text-neutral-400'}`}>
                {services.length}
              </span>
            </button>
            {categories.map((cat) => (
              <button
                key={cat.key}
                onClick={() => selectCategory(cat.key)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeCategory === cat.key
                    ? 'bg-neutral-900 text-white'
                    : 'bg-white text-neutral-600 border border-neutral-200 hover:border-neutral-400'
                }`}
              >
                {formatCategory(cat.key)}
                <span className={`ml-1.5 text-xs ${activeCategory === cat.key ? 'text-neutral-300' : 'text-neutral-400'}`}>
                  {cat.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <section className="bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          {loading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
          ) : activeCategory === 'All' ? (
            grouped.length === 0 ? (
              <EmptyState title="No services found" description="No services available yet." />
            ) : (
              <div className="space-y-12">
                {grouped.map(({ key, list }) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xl font-sans font-semibold text-neutral-900">{formatCategory(key)}</h2>
                      {list.length > PREVIEW_PER_CATEGORY && (
                        <button
                          onClick={() => selectCategory(key)}
                          className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary-700 hover:text-primary-800 transition"
                        >
                          View all {list.length} <ArrowRight size={12} />
                        </button>
                      )}
                    </div>
                    <div className="border border-neutral-200 bg-white rounded-lg overflow-hidden">
                      {groupKey(list[0]) !== (freeConsultation && groupKey(freeConsultation)) && renderConsultationRow()}
                      {list.slice(0, PREVIEW_PER_CATEGORY).map(renderRow)}
                      {list.length > PREVIEW_PER_CATEGORY && (
                        <button
                          onClick={() => selectCategory(key)}
                          className="w-full py-3 text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500 hover:text-primary-700 transition"
                        >
                          View all {list.length} {formatCategory(key).toLowerCase()} services
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : filtered.length === 0 ? (
            <EmptyState title="No services found" description="No services available in this category." />
          ) : (
            <div>
              <p className="text-sm text-neutral-500 mb-4">
                {filtered.length} treatment{filtered.length === 1 ? '' : 's'} in {formatCategory(activeCategory)}
              </p>
              <div className="border border-neutral-200 bg-white rounded-lg overflow-hidden">
                {freeConsultation && groupKey(freeConsultation) !== activeCategory && renderConsultationRow()}
                {filtered.map(renderRow)}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}