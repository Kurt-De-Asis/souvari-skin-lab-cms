import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Reveal from '../../components/ui/Reveal';

const TIMELINE = [
  {
    year: '2019',
    title: 'iBrow Department opens in Marikina',
    desc: 'A brow studio with a designer\'s obsession for mapping and proportion.',
  },
  {
    year: '2023',
    title: 'Philippines Microblading Champion — WULOP',
    desc: 'Kim wins the title at the World Ultimate League of PMU.',
  },
  {
    year: '2023–24',
    title: 'International teaching',
    desc: 'Kim begins training PMU artists abroad while raising the bar at home.',
  },
  {
    year: 'Today',
    title: 'Souvari Skin Lab',
    desc: 'A full medical-aesthetic clinic with licensed doctors, 30k+ followers, and one promise kept since day one.',
  },
];

const RULES = [
  {
    num: '01',
    title: 'Design before needle',
    desc: 'Every PMU and aesthetic plan starts with mapping, assessment, and your approval. Nothing is rushed onto your face or skin.',
  },
  {
    num: '02',
    title: 'The right expert per treatment',
    desc: 'Champion artistry for PMU and lashes. Licensed doctors overseeing skin, laser, contouring, and IV care. Never the wrong hands.',
  },
  {
    num: '03',
    title: 'Honesty over upsell',
    desc: 'If you don\'t need it yet, we say so. If another option fits better, we recommend it — even when it\'s the cheaper one.',
  },
  {
    num: '04',
    title: 'Natural is the standard',
    desc: 'Results should read as you on your best day. If it looks \'done\', we consider it undone.',
  },
];

export default function About() {
  return (
    <div>
      {/* Hero — Founder & artist */}
      <section className="bg-ink text-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-14 md:gap-16 items-center">
            <Reveal>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-300">
                  Founder &amp; artist
                </p>
                <h1 className="mt-6 text-4xl sm:text-5xl font-sans font-semibold leading-[1.1] tracking-wide">
                  Kimberly Anne<br />
                  Dia-una
                </h1>
                <p className="mt-4 italic text-primary-300 font-sans text-lg">
                  Founder · International Instructor · Champion PMU Artist
                </p>
                <p className="mt-6 text-neutral-300 leading-relaxed max-w-lg">
                  Kim didn't set out to build a beauty empire - she set out to fix bad brows.
                  The obsession with proportion, symmetry, and skin-true pigment that started in a small
                  Marikina studio eventually put her on the WULOP 2023 world stage, where she brought home
                  the Philippines Microblading Champion title.
                </p>
                <p className="mt-4 text-neutral-300 leading-relaxed max-w-lg">
                  Today she trains PMU artists internationally, and every artist and protocol at Souvari
                  carries her standard: designed, not stamped. Natural, not loud. Honest, always.
                </p>
              </div>
            </Reveal>
            <Reveal delay={120}>
              <div className="relative">
                <div className="absolute -top-6 -right-6 hidden md:block w-full h-full border border-primary-300/40" />
                <img
                  src="/images/team-photo.webp"
                  alt="Kimberly Anne Dia-una — Founder and PMU artist"
                  className="relative w-full h-72 sm:h-96 md:h-[520px] object-cover rounded-lg shadow-lg"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* The road here — Timeline */}
      <section className="bg-charcoal text-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-300">The road here</p>
            <h2 className="mt-4 text-3xl sm:text-4xl font-sans font-semibold">
              From brow studio to <em className="italic text-primary-300">medical-aesthetic clinic</em>
            </h2>
          </Reveal>

          <div className="mt-16 border-t border-neutral-600">
            {TIMELINE.map((item, i) => (
              <div
                key={item.year}
                className={`grid grid-cols-[4rem_1fr] md:grid-cols-[6rem_1fr] gap-x-6 md:gap-x-10 py-10 ${
                  i < TIMELINE.length - 1 ? 'border-b border-neutral-600' : ''
                }`}
              >
                <p className="font-sans text-3xl md:text-4xl font-semibold text-primary-300 leading-none pt-0.5">
                  {item.year}
                </p>
                <div>
                  <h3 className="font-sans text-xl md:text-2xl text-neutral-100">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-neutral-400 leading-relaxed max-w-xl">
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The IAVE Method — Four rules */}
      <section className="bg-neutral-900 text-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <Reveal>
            <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-300">The IAVE Method</p>
            <h2 className="mt-4 text-3xl sm:text-4xl font-sans font-semibold">
              Four rules we <em className="italic text-primary-300">never bend</em>
            </h2>
          </Reveal>
          <div className="mt-12 border-t border-neutral-700">
            {RULES.map((rule, i) => (
              <div
                key={rule.num}
                className={`grid grid-cols-[3rem_1fr] md:grid-cols-[4rem_1fr] gap-x-4 md:gap-x-6 py-10 ${
                  i < RULES.length - 1 ? 'border-b border-neutral-700' : ''
                }`}
              >
                <span className="font-sans text-2xl md:text-3xl font-semibold text-primary-300/60 leading-none pt-0.5">
                  {rule.num}
                </span>
                <div>
                  <h3 className="font-sans text-xl md:text-2xl text-neutral-100">
                    {rule.title}
                  </h3>
                  <p className="mt-2 text-neutral-400 leading-relaxed max-w-xl">
                    {rule.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The medical side */}
      <section className="bg-charcoal text-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div className="relative">
              <div className="absolute -bottom-6 -left-6 hidden md:block w-full h-full border border-primary-300/30" />
              <img
                  src="/images/clinic-top.webp"
                  alt="Licensed medical team at Souvari Skin Lab"
                  className="relative w-full h-80 md:h-[460px] object-cover rounded-lg shadow-lg"
                />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-300">The medical side</p>
              <h2 className="mt-4 text-3xl sm:text-4xl font-sans font-semibold">
                Licensed doctors, <em className="italic text-primary-300">in-house.</em>
              </h2>
              <p className="mt-4 text-neutral-300 leading-relaxed">
                Aesthetic medicine deserves medical hands. Dr. Lara and our licensed medical team oversee
                every skin, laser, contouring, and IV protocol at Souvari — from assessment through aftercare.
              </p>
              <p className="mt-4 text-neutral-400 leading-relaxed">
                It's why we can say yes to technologies like diode laser and HIFU with a straight face:
                the science is respected, the screening is real, and the honest "you don't need this"
                is always on the menu.
              </p>
              <div className="mt-10">
                <Link to="/services" className="btn-gold">
                  Explore the Services <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore the Services — image band */}
      <section className="bg-neutral-900 text-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
          <div className="relative">
            <div className="absolute -top-5 -right-5 hidden md:block w-full h-full border border-primary-300/30" />
<img
              src="/images/permanent-makeup.webp"
              alt="Editorial close-up of precise eyebrow mapping for permanent makeup artistry"
              className="relative w-full h-80 md:h-[420px] object-cover rounded-lg shadow-lg"
            />
          </div>
          <div className="mt-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 max-w-sm">
              Editorial close-up of precise eyebrow mapping for permanent makeup artistry
            </p>
            <Link
              to="/services"
              className="group flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-300 hover:text-primary-200 transition"
            >
              Explore the Services <ArrowRight size={14} className="transition group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA — Come meet the standard */}
      <section className="bg-ink text-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-300">Visit</p>
          <h2 className="mt-4 mx-auto max-w-3xl text-3xl sm:text-4xl md:text-5xl font-sans font-semibold text-neutral-100">
            Come meet the <em className="italic text-primary-300">standard.</em>
          </h2>
          <p className="mt-8 text-sm text-neutral-400 leading-relaxed max-w-2xl mx-auto">
            Unit 2C, RNJ Building, Bayan-Bayanan Ave, Concepcion, Marikina,
            1800 Metro Manila, Philippines · In front of Meralco Concepcion,
            beside EastWest Bank · Free parking
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link to="/booking" className="btn-gold">
              Book a Consultation
            </Link>
          </div>
          <div className="mt-16 border-t border-neutral-700 pt-10">
            <p className="font-sans text-lg text-neutral-400">Souvari Skin Lab</p>
            <p className="mt-1 italic text-sm text-neutral-500">Beauty that still looks like you.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
