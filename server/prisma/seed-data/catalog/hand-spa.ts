import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const HAND_SPA_INCLUSIONS = [
  'Nail Shaping',
  'Cuticle Cleaning',
  'Exfoliation Scrub',
  'Moisturizing Lotion',
  'Hot Towel Wrap',
];

const section: SectionDef = {
  slug: 'hand-spa',
  name: 'Hand Spa',
  display_order: 15,
  services: [
    {
      name: 'Hand Spa',
      slug: 'hand-spa',
      category: 'other',
      duration_minutes: 45,
      inclusions: [...HAND_SPA_INCLUSIONS],
      prices: vipNm(450, 550),
    },
    {
      name: 'Hand Spa + Whitening',
      slug: 'hand-spa-whitening',
      category: 'other',
      duration_minutes: 45,
      inclusions: [...HAND_SPA_INCLUSIONS, 'Whitening Treatment'],
      prices: vipNm(600, 700),
    },
    {
      name: 'Hand Spa + Whitening + Para Film',
      slug: 'hand-spa-whitening-para-film',
      category: 'other',
      duration_minutes: 45,
      inclusions: [...HAND_SPA_INCLUSIONS, 'Whitening Treatment', 'Para Film Wrap'],
      prices: vipNm(700, 800),
    },
  ],
};

export default section;
