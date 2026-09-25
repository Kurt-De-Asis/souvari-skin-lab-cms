import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README §4 · UltraTight® HIFU';

const section: SectionDef = {
  slug: 'ultratight-hifu',
  name: 'UltraTight® HIFU',
  display_order: 4,
  services: [
    { name: 'UltraTight V-Jaw & Chin Lift', slug: 'ht-v-jaw-chin-lift', category: 'skin_rejuvenation', duration_minutes: 60, prices: base(3790, SRC) },
    { name: 'Full Face Lift: Jaw, Chin & Neck', slug: 'ht-full-face-lift', category: 'skin_rejuvenation', duration_minutes: 75, prices: base(6490, SRC) },
    { name: 'Jawline & Chin', slug: 'ht-jawline-chin', category: 'skin_rejuvenation', duration_minutes: 45, prices: base(3490, SRC) },
    { name: 'Double Chin HIFU', slug: 'ht-double-chin', category: 'skin_rejuvenation', duration_minutes: 45, prices: base(3290, SRC) },
    { name: 'Neck Contouring', slug: 'ht-neck-contouring', category: 'skin_rejuvenation', duration_minutes: 45, prices: base(3390, SRC) },
    { name: 'Cheeks & Nasolabial Folds', slug: 'ht-cheeks-nasolabial', category: 'skin_rejuvenation', duration_minutes: 45, prices: base(4290, SRC) },
    { name: 'Eye Area HIFU', slug: 'ht-eye-area', category: 'skin_rejuvenation', duration_minutes: 30, prices: base(2990, SRC) },
    { name: 'Arms', slug: 'ht-arms', category: 'skin_rejuvenation', duration_minutes: 60, prices: base(3790, SRC) },
    { name: 'Abdomen', slug: 'ht-abdomen', category: 'skin_rejuvenation', duration_minutes: 75, prices: base(8990, SRC) },
    { name: 'Thighs', slug: 'ht-thighs', category: 'skin_rejuvenation', duration_minutes: 75, prices: base(7990, SRC) },
    { name: 'Back', slug: 'ht-back', category: 'skin_rejuvenation', duration_minutes: 75, prices: base(8490, SRC) },
    { name: 'Buttocks', slug: 'ht-buttocks', category: 'skin_rejuvenation', duration_minutes: 60, prices: base(7990, SRC) },
    { name: 'Flanks', slug: 'ht-flanks', category: 'skin_rejuvenation', duration_minutes: 60, prices: base(7990, SRC) },
  ],
};

export default section;