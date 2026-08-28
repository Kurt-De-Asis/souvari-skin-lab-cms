import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const FOOT_SPA_INCLUSIONS = [
  'Nail Shaping',
  'Cuticle Cleaning',
  'Exfoliation Scrub',
  'Moisturizing Lotion',
  'Hot Towel Wrap',
];

const section: SectionDef = {
  slug: 'foot-spa',
  name: 'Foot Spa',
  display_order: 16,
  services: [
    {
      name: 'Foot Spa',
      slug: 'foot-spa',
      category: 'other',
      duration_minutes: 45,
      inclusions: [...FOOT_SPA_INCLUSIONS],
      prices: vipNm(500, 600),
    },
    {
      name: 'Foot Spa + Whitening',
      slug: 'foot-spa-whitening',
      category: 'other',
      duration_minutes: 45,
      inclusions: [...FOOT_SPA_INCLUSIONS, 'Whitening Treatment'],
      prices: vipNm(650, 750),
    },
    {
      name: 'Foot Spa + Whitening + Para Film',
      slug: 'foot-spa-whitening-para-film',
      category: 'other',
      duration_minutes: 45,
      inclusions: [...FOOT_SPA_INCLUSIONS, 'Whitening Treatment', 'Para Film Wrap'],
      prices: vipNm(750, 850),
    },
  ],
};

export default section;
