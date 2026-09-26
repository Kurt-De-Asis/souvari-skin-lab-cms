import { useForm } from 'react-hook-form';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import { contactApi } from '@/api';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const hours = [
  { day: 'Monday – Friday', time: '9:00 AM – 6:00 PM' },
  { day: 'Saturday', time: '9:00 AM – 5:00 PM' },
  { day: 'Sunday', time: 'Closed' },
];

export default function Contact() {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ContactForm>();

  const onSubmit = async (values: ContactForm) => {
    try {
      await contactApi.sendMessage(values);
      toast.success("Message sent! We'll get back to you soon.");
      reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send message. Please try again.');
    }
  };

  return (
    <div>
      {/* Header */}
      <section className="bg-neutral-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-primary-400">Contact</p>
          <h1 className="mt-5 text-4xl sm:text-5xl font-sans font-semibold leading-[1.1]">Contact Us</h1>
          <p className="mt-4 text-neutral-300 max-w-2xl">
            Have a question or want to schedule a visit? We&rsquo;d love to hear from you.
          </p>
        </div>
      </section>

      <section className="bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16">
            {/* Form */}
            <div className="lg:col-span-3">
              <h2 className="text-2xl font-sans font-semibold text-neutral-900 mb-6">Send a Message</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 bg-white border border-neutral-200 p-6 md:p-8">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    className="input-field"
                    {...register('name', { required: 'Name is required' })}
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    {...register('email', {
                      required: 'Email is required',
                      pattern: { value: /^\S+@\S+\.\S+$/, message: 'Invalid email' },
                    })}
                  />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email.message}</p>}
                </div>
                <div>
                  <label className="label">Subject</label>
                  <input
                    className="input-field"
                    placeholder="How can we help?"
                    {...register('subject', { required: 'Subject is required' })}
                  />
                  {errors.subject && <p className="text-xs text-red-600 mt-1">{errors.subject.message}</p>}
                </div>
                <div>
                  <label className="label">Message</label>
                  <textarea
                    rows={5}
                    className="input-field resize-none"
                    placeholder="Tell us more..."
                    {...register('message', { required: 'Message is required' })}
                  />
                  {errors.message && <p className="text-xs text-red-600 mt-1">{errors.message.message}</p>}
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
                  <Send size={14} />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-sans font-semibold text-neutral-900 mb-6">Get in Touch</h2>

              <div className="border-t border-neutral-200">
                {[
                  { icon: MapPin, label: 'Address', value: '2nd Floor, The District Dasmariñas\nMolino-Paliparan Rd., Dasmariñas, Cavite' },
                  { icon: Phone, label: 'Phone', value: '0981-689-9909' },
                  { icon: Mail, label: 'Email', value: 'souvariskinlab@gmail.com' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4 py-5 border-b border-neutral-200">
                    <item.icon size={17} className="text-primary-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900">{item.label}</p>
                      <p className="text-sm text-neutral-500 mt-1 whitespace-pre-line">{item.value}</p>
                    </div>
                  </div>
                ))}

                {/* Hours */}
                <div className="py-5 border-b border-neutral-200">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock size={16} className="text-primary-600" />
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900">Operating Hours</p>
                  </div>
                  <div className="space-y-3">
                    {hours.map((h) => (
                      <div key={h.day} className="flex justify-between text-sm">
                        <span className="text-neutral-500">{h.day}</span>
                        <span className="font-medium text-neutral-700">{h.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Socials & Map */}
              <div className="mt-6 space-y-4">
                <div className="flex justify-center gap-4 py-2">
                  <a
                    href="https://www.instagram.com/souvariskinlab?stkn=MWpndjFsOGI4Z2Rzag=="
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-neutral-900 text-white hover:bg-primary-600 transition shadow-md"
                    title="Instagram"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                  </a>
                  <a
                    href="https://www.facebook.com/souvariskinlab"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 rounded-full bg-neutral-900 text-white hover:bg-primary-600 transition shadow-md"
                    title="Facebook"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24"><path d="M9 8H6v4h3v12h5V12h3.642L18 8h-4V6.333C14 5.37 14.5 5 15.5 5H18V0h-3.808C10.59 0 9 1.581 9 4.615V8z"/></svg>
                  </a>
                </div>

                <div className="bg-neutral-100 border border-neutral-200 h-56 rounded-md overflow-hidden">
                  <iframe
                    title="Souvari Skin Lab Location Map"
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3858.749557!2d120.9819336!3d14.3599099!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3397d5adefd3c8bb%3A0xa4d65f3723c69665!2sSouvari%20Skin%20Lab!5e0!3m2!1sen!2sph!4v1!5m2!1sen!2sph"
                    width="100%"
                    height="100%"
                    style={{ border: 0 }}
                    allowFullScreen={false}
                    loading="lazy"
                  />
                </div>
                <div className="text-center">
                  <a
                    href="https://www.google.com/maps/place/Souvari+Skin+Lab/@14.3599099,120.9793587,17z/data=!3m1!4b1!4m6!3m5!1s0x3397d5adefd3c8bb:0xa4d65f3723c69665!8m2!3d14.3599099!4d120.9819336!16s%2Fg%2F11zdbw702l"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-primary-600 hover:text-primary-700 underline"
                  >
                    Open in Google Maps →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}