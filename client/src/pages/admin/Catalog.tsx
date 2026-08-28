import { useState, useEffect, useCallback } from 'react';
import { Search, Clock, Scissors } from 'lucide-react';
import { servicesApi } from '@/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import EmptyState from '@/components/shared/EmptyState';
import Pagination from '@/components/ui/Pagination';

interface Service {
  id: number;
  name: string;
  category: string;
  duration_minutes: number;
  price: number;
  description?: string;
  status: string;
  is_active: boolean;
}

export default function Catalog() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        page: String(page),
        limit: '12',
      };
      if (search) params.search = search;
      if (activeCategory) params.category = activeCategory;

      const { data } = await servicesApi.list(params);
      const items = data.data?.data || data.data || [];
      setServices(items);
      setTotal(data.data?.pagination?.total || items.length || 0);
      setTotalPages(data.data?.pagination?.totalPages || 1);

      if (!activeCategory) {
        const cats = [...new Set(items.map((s: Service) => s.category).filter(Boolean))] as string[];
        setCategories(cats.sort());
      }
    } catch (err) {
      console.error('Failed to load catalog:', err);
    } finally {
      setLoading(false);
    }
  }, [page, activeCategory, search]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (cat: string | null) => {
    setActiveCategory(cat);
    setPage(1);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Catalog</h1>
          <p className="text-sm text-gray-500 mt-1">Browse all available services by category</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Scissors className="w-4 h-4" />
          {total} services
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search services..."
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleCategoryChange(null)}
          className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors ${
            activeCategory === null
              ? 'bg-gray-900 text-white border-gray-900'
              : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
          }`}
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors capitalize ${
              activeCategory === cat
                ? 'bg-gray-900 text-white border-gray-900'
                : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
            }`}
          >
            {cat.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : services.length === 0 ? (
        <EmptyState title="No services found" description="Try adjusting your search or filters." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => (
              <div
                key={service.id}
                className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-gray-900 text-sm leading-tight">{service.name}</h3>
                  <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-600 rounded-full whitespace-nowrap ml-2 capitalize">
                    {service.category?.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {service.duration_minutes} min
                  </span>
                  <span className="font-semibold text-gray-900">
                    ₱{Number(service.price).toLocaleString()}
                  </span>
                </div>

                {service.description && (
                  <p className="text-xs text-gray-400 line-clamp-2">{service.description}</p>
                )}

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className={`text-xs font-medium ${service.is_active ? 'text-green-600' : 'text-red-500'}`}>
                    {service.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            total={total}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
