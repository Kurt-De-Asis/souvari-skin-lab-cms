import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';
import { servicesApi } from '../../api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import formatCategory from '../../utils/formatCategory';
import { formatPosition, formatServicePrice } from '../../utils/format';
import categoryImage from '../../utils/categoryImages';

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
        const { data } = await servicesApi.browseById(Number(id));
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
          <ArrowLeft size={14} /> Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <section className="bg-neutral-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <Link to="/services" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.2em] text-neutral-300 hover:text-white transition mb-8">
            <ArrowLeft size={13} /> All Services
          </Link>
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-400">{formatCategory(service.category)}</p>
          <h1 className="mt-4 text-4xl sm:text-5xl font-sans font-semibold leading-[1.1]">{service.name}</h1>
        </div>
      </section>

      {/* Content */}
      <section className="bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
            {/* Main */}
            <div className="md:col-span-2 space-y-12">
              <div className="border-b border-neutral-200 pb-12">
                <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-900 mb-5">About This Service</h2>
                <p className="text-neutral-600 leading-relaxed whitespace-pre-line font-light">
                  {service.description
                    ? service.description
                    : 'Contact us for more details about this service.'}
                </p>
              </div>

              {service.staff && service.staff.length > 0 && (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-[0.25em] text-neutral-900 mb-5">Available Staff</h2>
                  <div className="border-t border-neutral-200">
                    {service.staff.map((s) => (
                      <div key={s.id} className="flex items-center gap-4 py-5 border-b border-neutral-200">
                        <div className="h-11 w-11 border border-neutral-300 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-sans font-semibold text-primary-700">{s.first_name[0]}{s.last_name[0]}</span>
                        </div>
                        <div>
                          <p className="font-sans text-lg text-neutral-900">{s.first_name} {s.last_name}</p>
                          <p className="text-xs uppercase tracking-wide text-neutral-400">{formatPosition(s.position)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div>
              <div className="sticky top-24">
                <img
                  src={categoryImage(service.category)}
                  alt={service.name}
                  className="w-full aspect-[4/5] object-cover rounded-lg shadow-sm mb-6"
                />
                <div className="bg-white border border-neutral-200 rounded-lg p-7 shadow-sm">
                  <p className="font-sans text-4xl font-semibold text-neutral-900">{formatServicePrice(service.price)}</p>
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mt-1">{Number(service.price) === 0 ? 'complimentary' : 'per session'}</p>
                  <div className="mt-6 space-y-3 pt-6 border-t border-neutral-200">
                    <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                      <Clock size={15} className="text-primary-600" />
                      <span>{service.duration} minutes</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-sm text-neutral-600">
                      <span className="text-primary-600">—</span>
                      <span>{formatCategory(service.category)}</span>
                    </div>
                  </div>
                  <Link to="/booking" state={{ serviceId: service.id }} className="btn-primary w-full justify-center mt-7">
                    Book This Service
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}