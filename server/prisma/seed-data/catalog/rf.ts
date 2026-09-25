import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README §5 · Radio Frequency (RF)';

const section: SectionDef = {
  slug: 'radio-frequency',
  name: 'Radio Frequency (RF)',
  display_order: 5,
  services: [
    { name: 'Double Chin', slug: 'rf-double-chin', category: 'skin_rejuvenation', duration_minutes: 30, prices: base(1500, SRC) },
    { name: 'Neck', slug: 'rf-neck', category: 'skin_rejuvenation', duration_minutes: 30, prices: base(1500, SRC) },
    { name: 'Face', slug: 'rf-face', category: 'skin_rejuvenation', duration_minutes: 30, prices: base(2000, SRC) },
    { name: 'Face + Neck', slug: 'rf-face-neck', category: 'skin_rejuvenation', duration_minutes: 45, prices: base(2500, SRC) },
    { name: 'Underarms', slug: 'rf-underarms', category: 'skin_rejuvenation', duration_minutes: 30, prices: base(1500, SRC) },
    { name: 'Upper Arms', slug: 'rf-upper-arms', category: 'skin_rejuvenation', duration_minutes: 45, prices: base(2500, SRC) },
    { name: 'Bra Fat', slug: 'rf-bra-fat', category: 'skin_rejuvenation', duration_minutes: 30, prices: base(2000, SRC) },
    { name: 'Abdomen', slug: 'rf-abdomen', category: 'skin_rejuvenation', duration_minutes: 45, prices: base(3000, SRC) },
    { name: 'Waist/Love Handles', slug: 'rf-waist', category: 'skin_rejuvenation', duration_minutes: 45, prices: base(2500, SRC) },
    { name: 'Abdomen + Waist', slug: 'rf-abdomen-waist', category: 'skin_rejuvenation', duration_minutes: 60, prices: base(4500, SRC) },
    { name: 'Full Back', slug: 'rf-full-back', category: 'skin_rejuvenation', duration_minutes: 45, prices: base(3500, SRC) },
    { name: 'Buttocks', slug: 'rf-buttocks', category: 'skin_rejuvenation', duration_minutes: 45, prices: base(3000, SRC) },
    { name: 'Inner Thighs', slug: 'rf-inner-thighs', category: 'skin_rejuvenation', duration_minutes: 45, prices: base(3000, SRC) },
    { name: 'Outer Thighs', slug: 'rf-outer-thighs', category: 'skin_rejuvenation', duration_minutes: 45, prices: base(3000, SRC) },
    { name: 'Full Tights', slug: 'rf-full-thighs', category: 'skin_rejuvenation', duration_minutes: 60, prices: base(4500, SRC) },
    { name: 'Knees', slug: 'rf-knees', category: 'skin_rejuvenation', duration_minutes: 30, prices: base(1500, SRC) },
    { name: 'Calves', slug: 'rf-calves', category: 'skin_rejuvenation', duration_minutes: 45, prices: base(2500, SRC) },
  ],
};

export default section;