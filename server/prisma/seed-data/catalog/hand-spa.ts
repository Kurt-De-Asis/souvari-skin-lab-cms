import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.33-36 · Hand Spa Services';

const section: SectionDef = {
  slug: 'hand-spa',
  name: 'Hand Spa',
  display_order: 15,
  services: [
    { name: 'Essential Hand Spa', slug: 'hs-essential', category: 'other', duration_minutes: 30, prices: vipNm(187, 249, { source_ref: SRC }) },
    { name: 'Deluxe Hand Spa', slug: 'hs-deluxe', category: 'other', duration_minutes: 50, prices: vipNm(299, 399, { source_ref: SRC }) },
    { name: 'Ultimate Luxe Hand Spa', slug: 'hs-ultimate-luxe', category: 'other', duration_minutes: 75, prices: vipNm(449, 599, { source_ref: SRC }) },
  ],
};

export default section;