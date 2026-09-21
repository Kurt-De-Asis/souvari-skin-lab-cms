import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock, HeartHandshake, ShieldCheck, Sparkles } from 'lucide-react';
import { servicesApi } from '../../api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
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

const MARQUEE_ITEMS = [
  { text: 'Beauty in every detail', variant: 'outline' },
  { text: 'Souvari Skin Lab', variant: 'italic' },
  { text: 'Personalised skin rituals', variant: 'outline' },
  { text: 'Science-backed aesthetic care', variant: 'italic' },
  { text: 'Makati City · Est. 2020', variant: 'outline' },
];

const STATS = [
  { value: '10,000+', label: 'Happy Clients' },
  { value: '15+', label: 'Years of Expertise' },
  { value: '50+', label: 'Signature Treatments' },
];

const FEATURED = [
  {
    serviceId: 251,
    image: '/images/facial-services.webp',
    alt: 'Signature facial at Souvari Skin Lab',
    eyebrow: 'Signature facials',
    flip: false,
  },
  {
    serviceId: 12,
    image: '/images/doctor-procedures.webp',
    alt: 'Advanced treatment procedures at Souvari Skin Lab',
    eyebrow: 'Medical aesthetic care',
    flip: true,
  },
  {
    serviceId: 402,
    image: '/images/permanent-makeup.webp',
    alt: 'Permanent makeup artistry at Souvari Skin Lab',
    eyebrow: 'Permanent makeup',
    flip: false,
  },
];

const CATEGORY_PHOTOS = [
  { image: '/images/facial-services.webp', label: 'Facials' },
  { image: '/images/nails-services.webp', label: 'Nails' },
  { image: '/images/permanent-makeup.webp', label: 'Permanent Makeup' },
  { image: '/images/waxing.webp', label: 'Waxing' },
  { image: '/images/footspa.webp', label: 'Foot Spa' },
  { image: '/images/doctor-procedures.webp', label: "Doctor's Procedures" },
];

const FEATURES = [
  { icon: ShieldCheck, title: 'Licensed Professionals', desc: 'Board-certified aestheticians and licensed medical professionals with years of hands-on experience.' },
  { icon: Sparkles, title: 'Advanced Technology', desc: 'Latest FDA-approved equipment and premium products for safe, effective, lasting results.' },
  { icon: HeartHandshake, title: 'Personalized Care', desc: 'Every plan is tailored to your skin type, concerns, and beauty goals — no one-size-fits-all.' },
];

const CONCERNS = [
  'Facials & skin',
  'Laser & hair removal',
  'Rejuvenation & peels',
  'Injectables & IV',
  'Body sculpting',
  'Consultations & packages',
  'Brows, lashes & nails',
];

export default function Home() {
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

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
        setAllServices(all);
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const listServices = allServices.slice(0, 6);

  const featured = useMemo(
    () =>
      FEATURED.map((f) => ({
        ...f,
        service: allServices.find((s) => s.id === f.serviceId),
      })).filter((f) => f.service) as Array<{
        serviceId: number;
        image: string;
        alt: string;
        eyebrow: string;
        flip: boolean;
        service: Service;
      }>,
    [allServices]
  );

  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-[85vh] md:min-h-[90vh] flex items-center justify-center bg-ink text-neutral-100 overflow-hidden">
        {/* Full-width landscape background image with dark overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/clinic-top.webp"
            alt="Souvari Skin Lab Hero"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-neutral-950/70 backdrop-blur-[2px]" />
        </div>

        {/* Centered Hero Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          <Reveal>
            <div className="space-y-6 flex flex-col items-center">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary-300">
                Welcome to Souvari Skin Lab
              </p>
              <h1 className="text-4xl sm:text-6xl md:text-7xl font-sans font-semibold leading-[1.08] tracking-wide max-w-4xl">
                Revitalize, Rejuvenate,<br />
                <em className="italic text-primary-300">Breathe.</em>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-neutral-300 leading-relaxed max-w-2xl font-light">
                Helping you age gracefully and look like the best version of you!
              </p>
              <p className="text-sm sm:text-base text-neutral-400 leading-relaxed max-w-3xl font-light">
                At Souvari Skin Lab, we offer a variety of products and treatments that can help soften
                signs of aging and improve the health and appearance of your skin. Our services are
                comprehensive, and we are dedicated to providing an exceptional experience for both our
                returning and new clients.
              </p>
              <div className="pt-4 flex flex-wrap justify-center gap-4">
                <Link to="/booking" className="btn-gold">
                  Book An Appointment <ArrowRight size={14} />
                </Link>
                <Link to="/services" className="btn-outline-light">
                  Explore Treatments
                </Link>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Marquee */}
      <section className="overflow-hidden border-y py-8 md:py-12 border-primary-300/20 bg-charcoal">
        <p className="sr-only">
          Beauty in every detail. Souvari Skin Lab. Personalised skin rituals. Science-backed aesthetic care. Makati City, Est. 2020
        </p>
        <div className="flex whitespace-nowrap animate-marquee" aria-hidden="true">
          {[0, 1].map((group) => (
            <div key={group} className="flex shrink-0 items-baseline">
              {MARQUEE_ITEMS.map((item, idx) => (
                <span key={idx} className="flex items-baseline whitespace-nowrap">
                  <span className={`font-sans px-8 text-[clamp(2.75rem,6vw,5.5rem)] leading-none md:px-14 ${item.variant === 'outline' ? 'text-outline' : 'italic text-primary-300'}`}>
                    {item.text}
                  </span>
                  <span aria-hidden="true" className="mx-2 block h-px w-10 bg-primary-300/40" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-charcoal">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 md:pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 border-t border-neutral-600 pt-12 md:pt-16">
            {STATS.map((s) => (
              <div key={s.label} className="text-center">
                <p className="text-3xl font-sans font-semibold text-neutral-100">{s.value}</p>
                <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 mt-2">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Category imagery */}
      <section className="bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <Reveal>
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-600">What we do</p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-sans font-semibold text-neutral-900">
                Treatments you can <em className="italic text-primary-600">trust</em>
              </h2>
            </div>
          </Reveal>
          <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {CATEGORY_PHOTOS.map((c, i) => (
              <Reveal key={c.label} delay={Math.min(i * 60, 240)}>
                <Link
                  to="/services"
                  className="group relative overflow-hidden rounded-lg block"
                >
                  <img
                    src={c.image}
                    alt={`${c.label} at Souvari Skin Lab`}
                    className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <span className="absolute bottom-4 left-4 right-4 text-sm font-semibold uppercase tracking-[0.18em] text-white">
                    {c.label}
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Services — editorial list */}
      <section className="bg-neutral-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <Reveal>
            <div className="flex items-end justify-between mb-12">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-300">The menu</p>
                <h2 className="mt-4 text-3xl sm:text-4xl font-sans font-semibold text-neutral-100">
                  Signature <em className="italic text-primary-300">Treatments</em>
                </h2>
                <p className="mt-3 text-neutral-400 max-w-xl">
                  Curated, results-driven treatments designed for every skin story.
                </p>
              </div>
              <Link to="/services" className="hidden sm:flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-300 hover:text-primary-200 transition">
                View all <ArrowRight size={13} />
              </Link>
            </div>
          </Reveal>

          {loading ? (
            <div className="py-12 flex justify-center"><LoadingSpinner /></div>
          ) : (
            <div className="border-t border-neutral-700">
              {listServices.map((service) => (
                <Link
                  key={service.id}
                  to={`/services/${service.id}`}
                  className="group flex items-center justify-between gap-6 py-6 border-b border-neutral-700 transition"
                >
                  <div className="min-w-0">
                    <h3 className="font-sans text-xl md:text-2xl text-neutral-100 group-hover:text-primary-300 transition">
                      {service.name}
                    </h3>
                    <p className="mt-1 text-sm text-neutral-400 line-clamp-1 md:line-clamp-none">
                      {service.description}
                    </p>
                    <div className="mt-2 flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-500">
                      <span className="flex items-center gap-1.5"><Clock size={12} /> {service.duration} min</span>
                      <span className="text-neutral-600">·</span>
                      <span>{formatCategory(service.category)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-5 flex-shrink-0">
                    <span className="font-sans text-lg text-primary-300 whitespace-nowrap">₱{service.price.toLocaleString()}</span>
                    <ArrowRight size={18} className="text-neutral-500 transition group-hover:translate-x-1 group-hover:text-primary-300" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 sm:hidden">
            <Link to="/services" className="btn-outline-light w-full text-sm">
              View All Services
            </Link>
          </div>
        </div>
      </section>

      {/* Signature rituals — alternating editorial rows */}
      <section className="bg-charcoal">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24 space-y-20 md:space-y-28">
          <Reveal>
            <div className="text-center">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-300">Signatures</p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-sans font-semibold text-neutral-100">
                Beauty, <em className="italic text-primary-300">Considered</em>
              </h2>
            </div>
          </Reveal>
          {featured.map((f, i) => (
            <Reveal key={f.service.id} delay={Math.min(i * 80, 240)}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
                <div className={`relative ${f.flip ? 'lg:order-2' : ''}`}>
                  <div className={`absolute w-full h-full border border-primary-300/30 ${f.flip ? '-top-6 -right-4' : '-bottom-6 -left-4'}`} />
                  <img
                    src={f.image}
                    alt={f.alt}
                    className="relative w-full h-72 md:h-[420px] object-cover"
                  />
                </div>
                <div className={f.flip ? 'lg:order-1' : ''}>
                  <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-300">{f.eyebrow}</p>
                  <h3 className="mt-4 text-2xl sm:text-3xl font-sans font-semibold text-neutral-100">
                    {f.service.name}
                  </h3>
                  <p className="mt-4 text-neutral-300 leading-relaxed max-w-xl">
                    {f.service.description || 'Contact us for more details about this treatment.'}
                  </p>
                  <div className="mt-3 flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-400">
                    <span className="flex items-center gap-1.5"><Clock size={12} /> {f.service.duration} min</span>
                    <span className="text-neutral-600">·</span>
                    <span className="font-sans text-base text-primary-300 normal-case tracking-normal">₱{f.service.price.toLocaleString()}</span>
                    <span className="text-neutral-600">·</span>
                    <span>{formatCategory(f.service.category)}</span>
                  </div>
                  <div className="mt-8 flex flex-wrap gap-4">
                    <Link to="/booking" state={{ serviceId: f.service.id }} className="btn-gold">
                      Book This Treatment
                    </Link>
                    <Link to="/services" className="btn-outline-light">
                      View Treatments
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* The Souvari Difference */}
      <section className="bg-ink">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal>
              <div className="relative">
                <div className="absolute -top-5 -left-5 hidden md:block w-full h-full border border-primary-300/30" />
                <img
                  src="/images/team-photo.webp"
                  alt="The Souvari Skin Lab team"
                  className="relative w-full h-80 md:h-[500px] object-cover rounded-lg shadow-lg"
                />
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-300">The Souvari Difference</p>
                <h2 className="mt-4 text-3xl sm:text-4xl font-sans font-semibold text-neutral-100">
                  Beauty, <em className="italic text-primary-300">backed by science</em>
                </h2>
                <p className="mt-4 text-neutral-300 leading-relaxed">
                  We pair advanced aesthetic technology with a warm, personal touch — helping you feel
                  confident in your own skin, one treatment at a time.
                </p>
                <div className="mt-10 space-y-8 border-t border-neutral-700">
                  {FEATURES.map((f) => (
                    <div key={f.title} className="flex items-start gap-5 pt-8">
                      <div className="mt-0.5 h-11 w-11 border border-primary-300/40 text-primary-300 flex items-center justify-center flex-shrink-0">
                        <f.icon size={17} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold uppercase tracking-wide text-neutral-100">{f.title}</h3>
                        <p className="text-sm text-neutral-400 mt-1 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Concerns */}
      <section className="bg-neutral-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <Reveal>
            <div className="max-w-2xl">
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-300">Where to start</p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-sans font-semibold text-neutral-100">
                Tell us your goal — <em className="italic text-primary-300">we'll design the path</em>.
              </h2>
              <div aria-hidden="true" className="mt-8 h-px w-full bg-primary-300/70" />
            </div>
          </Reveal>
          <div className="mt-12 flex flex-wrap gap-3">
            {CONCERNS.map((c, i) => (
              <Reveal key={c} delay={Math.min(i * 50, 200)}>
                <Link
                  to="/services"
                  className="inline-block border border-primary-300/30 px-7 py-4 font-sans text-xl text-neutral-100 transition hover:border-primary-300 hover:text-primary-300"
                >
                  {c}
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* The Souvari Ritual — dark band */}
      <section className="bg-charcoal text-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <Reveal>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-300">The ritual</p>
                <h2 className="mt-4 text-3xl sm:text-4xl font-sans font-semibold">
                  Skin, <em className="italic text-primary-300">Elevated</em>
                </h2>
                <p className="mt-5 text-neutral-300 leading-relaxed max-w-lg">
                  Every visit begins with a consultation and ends with a ritual — layers of care applied
                  slowly, thoughtfully, and precisely. The result is skin that looks like you, only softer.
                </p>
                <div className="mt-9 flex flex-wrap gap-4">
                  <Link to="/booking" className="btn-gold">
                    Begin Your Ritual
                  </Link>
                  <Link to="/contact" className="btn-outline-light">
                    Contact Us
                  </Link>
                </div>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <div className="relative">
                <div className="absolute -bottom-6 -right-6 hidden md:block w-full h-full border border-primary-300/40" />
                <img
                  src="/images/footspa.webp"
                  alt="The Souvari skin ritual — foot spa"
                  className="relative w-full h-80 md:h-[440px] object-cover rounded-lg shadow-lg"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative bg-cover bg-center" style={{ backgroundImage: "url('/images/booking-bg.webp')" }}>
        <div className="absolute inset-0 bg-black/70" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-300">Begin here</p>
            <h2 className="mt-4 mx-auto max-w-3xl text-3xl sm:text-4xl md:text-5xl font-sans font-semibold text-neutral-100">
              Your best skin starts <em className="italic text-primary-300">today</em>
            </h2>
            <p className="mt-4 text-neutral-300 max-w-xl mx-auto">
              Every treatment begins with an honest conversation about your goals and your skin. Booking
              takes under a minute, and our team confirms personally.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-4">
              <Link to="/booking" className="btn-gold bg-primary-500">
                Book Appointment
              </Link>
              <Link to="/contact" className="btn-outline-light">
                Contact Us
              </Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}