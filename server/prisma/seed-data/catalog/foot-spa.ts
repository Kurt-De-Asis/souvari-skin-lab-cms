import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.37-40 · Foot Spa Services';

const section: SectionDef = {
  slug: 'foot-spa',
  name: 'Foot Spa',
  display_order: 16,
  services: [
    { name: 'Essential Foot Spa', slug: 'fs-essential', category: 'other', duration_minutes: 40, prices: vipNm(262, 349, { source_ref: SRC }) },
    { name: 'Deluxe Foot Spa', slug: 'fs-deluxe', category: 'other', duration_minutes: 70, prices: vipNm(449, 599, { source_ref: SRC }) },
    { name: 'Ultimate Luxe Foot Spa', slug: 'fs-ultimate-luxe', category: 'other', duration_minutes: 90, prices: vipNm(599, 799, { source_ref: SRC }) },
  ],
};

export default section;