import { SectionDef } from '../types';
import { vipNmRegular } from '../helpers';

const section: SectionDef = {
  slug: 'consultations',
  name: 'Consultations',
  description: 'Complimentary skin consultation for new clients.',
  display_order: 100,
  services: [
    {
      name: 'Consultation First (Recommended for New Clients)',
      slug: 'consultation-first',
      category: 'consultation',
      duration_minutes: 15,
      description:
        'Start with a complimentary face-to-face skin consultation. Our professionals assess your skin and build a personalized treatment plan before you commit to any service.',
      online_booking: 'Enabled',
      available_for: 'Everyone',
      voucher_sales: 'Enabled',
      commissions: 'Enabled',
      prices: vipNmRegular(0, 0, 0),
    },
  ],
};

export default section;