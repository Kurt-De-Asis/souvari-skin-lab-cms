import { useForm } from 'react-hook-form';
import { MapPin, Phone, Mail, Clock, Send } from 'lucide-react';
import toast from 'react-hot-toast';
import ChatbotWidget from '../../components/chatbot/ChatbotWidget';

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
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Message sent! We'll get back to you soon.");
    reset();
  };

  return (
    <div>
      {/* Header */}
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-semibold text-neutral-900">Contact Us</h1>
          <p className="mt-2 text-neutral-500">Have a question or want to schedule a visit? We'd love to hear from you.</p>
        </div>
      </section>

      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <div>
              <h2 className="text-lg font-semibold text-neutral-900 mb-5">Send a Message</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="label">Full Name</label>
                  <input
                    className="input-field"
                    placeholder="Juan Dela Cruz"
                    {...register('name', { required: 'Name is required' })}
                  />
                  {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className="label">Email</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="you@example.com"
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
                  <Send size={16} />
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            </div>

            {/* Contact Info */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-neutral-900">Get in Touch</h2>

              <div className="space-y-3">
                {[
                  { icon: MapPin, label: 'Address', value: '123 Beauty Ave, Makati City\nMetro Manila, Philippines' },
                  { icon: Phone, label: 'Phone', value: '+63 917 123 4567' },
                  { icon: Mail, label: 'Email', value: 'souvariskinlab@gmail.com' },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-3 p-4 rounded-xl border border-neutral-200">
                    <item.icon size={16} className="text-neutral-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{item.label}</p>
                      <p className="text-sm text-neutral-500 mt-0.5 whitespace-pre-line">{item.value}</p>
                    </div>
                  </div>
                ))}

                {/* Hours */}
                <div className="p-4 rounded-xl border border-neutral-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock size={16} className="text-neutral-400" />
                    <p className="text-sm font-medium text-neutral-900">Operating Hours</p>
                  </div>
                  <div className="space-y-2">
                    {hours.map((h) => (
                      <div key={h.day} className="flex justify-between text-sm">
                        <span className="text-neutral-500">{h.day}</span>
                        <span className="font-medium text-neutral-700">{h.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Map Placeholder */}
              <div className="bg-neutral-50 rounded-xl border border-neutral-200 flex items-center justify-center h-40">
                <div className="text-center text-neutral-400">
                  <MapPin size={24} className="mx-auto mb-1.5" />
                  <p className="text-xs">Map coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <ChatbotWidget />
    </div>
  );
}
