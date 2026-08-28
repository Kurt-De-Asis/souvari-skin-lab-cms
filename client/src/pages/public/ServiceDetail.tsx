import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';
import { servicesApi } from '../../api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

interface ServiceStaff {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
}

interface ServiceDetail {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  staff?: ServiceStaff[];
}

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const [service, setService] = useState<ServiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchService = async () => {
      try {
        const { data } = await servicesApi.getById(Number(id));
        const raw = data.data;
        setService({
          ...raw,
          price: Number(raw.price) || 0,
          duration: Number(raw.duration || raw.duration_minutes) || 0,
        });
      } catch {
        setError('Service not found.');
      } finally {
        setLoading(false);
      }
    };
    fetchService();
  }, [id]);

  if (loading) return <LoadingSpinner fullScreen />;

  if (error || !service) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <p className="text-neutral-500">{error || 'Service not found.'}</p>
        <Link to="/services" className="btn-primary mt-6 inline-flex">
          <ArrowLeft size={16} /> Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Link to="/services" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition mb-6">
            <ArrowLeft size={14} /> All Services
          </Link>
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">{service.category}</span>
          <h1 className="text-3xl font-semibold text-neutral-900 mt-2">{service.name}</h1>
        </div>
      </section>

      {/* Content */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid md:grid-cols-3 gap-10">
            {/* Main */}
            <div className="md:col-span-2 space-y-8">
              <div>
                <h2 className="text-lg font-semibold text-neutral-900 mb-3">About This Service</h2>
                <p className="text-neutral-600 leading-relaxed whitespace-pre-line">{service.description}</p>
              </div>

              {service.staff && service.staff.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 mb-3">Available Staff</h2>
                  <div className="space-y-2">
                    {service.staff.map((s) => (
                      <div key={s.id} className="flex items-center gap-3 p-4 rounded-xl border border-neutral-200">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-medium text-neutral-600">{s.first_name[0]}{s.last_name[0]}</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-900">{s.first_name} {s.last_name}</p>
                          <p className="text-xs text-neutral-400">{s.position}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div className="sticky top-24 p-6 rounded-xl border border-neutral-200">
                <div className="mb-6">
                  <p className="text-3xl font-semibold text-neutral-900">₱{service.price.toLocaleString()}</p>
                  <p className="text-sm text-neutral-400 mt-1">per session</p>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                    <Clock size={15} className="text-neutral-400" />
                    <span>{service.duration} minutes</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                    <span className="text-neutral-400">·</span>
                    <span>{service.category}</span>
                  </div>
                </div>
                <Link to="/booking" state={{ serviceId: service.id }} className="btn-primary w-full justify-center">
                  Book This Service
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
