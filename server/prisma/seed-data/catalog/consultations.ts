import { CatalogServiceInput, SectionDef } from '../types';
import { base } from '../helpers';

const services: CatalogServiceInput[] = [
  {
    name: 'Consultation First (Recommended for New Clients)',
    slug: 'consultation-first',
    category: 'consultation',
    description: 'Complimentary skin consultation for new clients.',
    duration_minutes: 15,
    needs_verification: false,
    online_booking: 'Enabled',
    available_for: 'Everyone',
    voucher_sales: 'Enabled',
    commissions: 'Enabled',
    prices: base(0),
  },
];

const section: SectionDef = {
  slug: 'consultations',
  name: 'Consultations',
  description: 'Complimentary skin consultation for new clients.',
  display_order: 0,
  is_bookable: true,
  services,
};

export default section;