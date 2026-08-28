import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { staffApi } from '../../api';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  position: string;
}

const fallbackTeam = [
  { name: 'Dr. Maria Santos', role: 'Medical Director', bio: 'Board-certified dermatologist with 15+ years of experience in aesthetic medicine.' },
  { name: 'Ana Reyes', role: 'Lead Aesthetician', bio: 'Certified skin care specialist passionate about personalized treatment plans.' },
  { name: 'Carlo Bautista', role: 'Laser Technician', bio: 'Expert in advanced laser treatments with a focus on safety and precision.' },
];

export default function About() {
  const [team, setTeam] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const { data } = await staffApi.list();
        setTeam(data.data || []);
      } catch {
        // use fallback
      } finally {
        setLoading(false);
      }
    };
    fetchTeam();
  }, []);

  return (
    <div>
      {/* Header */}
      <section className="bg-white border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-semibold text-neutral-900">About Souvari Skin Lab</h1>
          <p className="mt-2 text-neutral-500">Empowering confidence through exceptional aesthetic care since 2009.</p>
        </div>
      </section>

      {/* Story */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-2xl font-semibold text-neutral-900">Our Story</h2>
              <p className="mt-4 text-neutral-600 leading-relaxed">
                Founded in the heart of Metro Manila, Souvari Skin Lab began with a simple mission: to make premium aesthetic treatments accessible to everyone. What started as a small clinic has grown into one of the most trusted names in aesthetic care.
              </p>
              <p className="mt-4 text-neutral-600 leading-relaxed">
                Our team of licensed professionals combines medical expertise with an artistic eye to help each client look and feel their absolute best.
              </p>
            </div>
            <div className="bg-neutral-50 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[280px]">
              <p className="text-4xl font-display font-bold text-neutral-900">15+</p>
              <p className="text-sm text-neutral-500 mt-1">Years of Trusted Excellence</p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-neutral-900">Our Mission & Values</h2>
            <p className="mt-2 text-neutral-500">To enhance natural beauty through safe, innovative, and personalized treatments.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Compassion', desc: 'We treat every client with empathy, respect, and genuine care.' },
              { title: 'Excellence', desc: 'We strive for the highest quality in every treatment.' },
              { title: 'Integrity', desc: 'Honest consultations and transparent pricing with no surprises.' },
              { title: 'Innovation', desc: 'Cutting-edge techniques and technology for superior results.' },
            ].map((v) => (
              <div key={v.title} className="bg-white rounded-xl border border-neutral-200 p-5">
                <h3 className="text-base font-semibold text-neutral-900">{v.title}</h3>
                <p className="text-sm text-neutral-500 mt-2 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-semibold text-neutral-900">Meet Our Team</h2>
            <p className="mt-2 text-neutral-500">Dedicated professionals committed to your beauty and wellness.</p>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(team.length > 0 ? team : fallbackTeam).map((member: any, idx: number) => (
                <div key={member.id || idx} className="p-5 rounded-xl border border-neutral-200">
                  <div className="w-14 h-14 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                    <Users size={24} className="text-neutral-400" />
                  </div>
                  <h3 className="text-base font-semibold text-neutral-900">
                    {member.first_name ? `${member.first_name} ${member.last_name}` : member.name}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-1">{member.position || member.role}</p>
                  {member.bio && <p className="text-sm text-neutral-500 mt-3 leading-relaxed">{member.bio}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
