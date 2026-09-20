import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.9 · UltraTight HIFU';

const section: SectionDef = {
  slug: 'ultratight-hifu',
  name: 'UltraTight HIFU',
  display_order: 6,
  services: [
    { name: 'UltraTight V-Jaw & Chin Lift', slug: 'ht-v-jaw-chin-lift', category: 'skin_rejuvenation', duration_minutes: 60, prices: vipNm(2843, 3790, { source_ref: SRC }) },
    { name: 'Full Face Lift: Jaw, Chin & Neck', slug: 'ht-full-face-lift', category: 'skin_rejuvenation', duration_minutes: 75, prices: vipNm(4868, 6490, { source_ref: SRC }) },
    { name: 'Jawline & Chin', slug: 'ht-jawline-chin', category: 'skin_rejuvenation', duration_minutes: 45, prices: vipNm(2618, 3490, { source_ref: SRC }) },
    { name: 'Double Chin HIFU', slug: 'ht-double-chin', category: 'skin_rejuvenation', duration_minutes: 45, prices: vipNm(2468, 3290, { source_ref: SRC }) },
    { name: 'Neck Contouring', slug: 'ht-neck-contouring', category: 'skin_rejuvenation', duration_minutes: 45, prices: vipNm(2543, 3390, { source_ref: SRC }) },
    { name: 'Cheeks & Nasolabial Folds', slug: 'ht-cheeks-nasolabial', category: 'skin_rejuvenation', duration_minutes: 45, prices: vipNm(3218, 4290, { source_ref: SRC }) },
    { name: 'Eye Area HIFU', slug: 'ht-eye-area', category: 'skin_rejuvenation', duration_minutes: 30, prices: vipNm(2243, 2990, { source_ref: SRC }) },
    { name: 'Arms', slug: 'ht-arms', category: 'skin_rejuvenation', duration_minutes: 60, prices: vipNm(2843, 3790, { source_ref: SRC }) },
    { name: 'Abdomen', slug: 'ht-abdomen', category: 'skin_rejuvenation', duration_minutes: 75, prices: vipNm(6743, 8990, { source_ref: SRC }) },
    { name: 'Thighs', slug: 'ht-thighs', category: 'skin_rejuvenation', duration_minutes: 75, prices: vipNm(5993, 7990, { source_ref: SRC }) },
    { name: 'Back', slug: 'ht-back', category: 'skin_rejuvenation', duration_minutes: 75, prices: vipNm(6368, 8490, { source_ref: SRC }) },
    { name: 'Buttocks', slug: 'ht-buttocks', category: 'skin_rejuvenation', duration_minutes: 60, prices: vipNm(5993, 7990, { source_ref: SRC }) },
    { name: 'Flanks', slug: 'ht-flanks', category: 'skin_rejuvenation', duration_minutes: 60, prices: vipNm(5993, 7990, { source_ref: SRC }) },
  ],
};

export default section;