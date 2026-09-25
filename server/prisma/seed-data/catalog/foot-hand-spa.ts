import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README §13 · FOOT SPA AND HAND SPA';

const section: SectionDef = {
  slug: 'foot-hand-spa',
  name: 'FOOT SPA AND HAND SPA',
  display_order: 13,
  services: [
    { name: 'Essential Hand Spa', slug: 'hs-essential', category: 'other', duration_minutes: 30, prices: base(249, SRC) },
    { name: 'Deluxe Hand Spa', slug: 'hs-deluxe', category: 'other', duration_minutes: 50, prices: base(399, SRC) },
    { name: 'Ultimate Luxe Hand Spa', slug: 'hs-ultimate-luxe', category: 'other', duration_minutes: 75, prices: base(599, SRC) },
    { name: 'Essential Foot Spa', slug: 'fs-essential', category: 'other', duration_minutes: 40, prices: base(349, SRC) },
    { name: 'Deluxe Foot Spa', slug: 'fs-deluxe', category: 'other', duration_minutes: 70, prices: base(599, SRC) },
    { name: 'Ultimate Luxe Foot Spa', slug: 'fs-ultimate-luxe', category: 'other', duration_minutes: 90, prices: base(799, SRC) },
  ],
};

export default section;