import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README §3 · DIODE LASER HAIR REMOVAL';

const section: SectionDef = {
  slug: 'diode-laser',
  name: 'DIODE LASER HAIR REMOVAL',
  display_order: 3,
  services: [
    { name: 'Upper Lip / Lower Lip', slug: 'di-upper-lip', category: 'hair_removal', duration_minutes: 15, prices: base(679, SRC) },
    { name: 'Chin', slug: 'di-chin', category: 'hair_removal', duration_minutes: 15, prices: base(929, SRC) },
    { name: 'Sideburns / Cheeks', slug: 'di-sideburns', category: 'hair_removal', duration_minutes: 20, prices: base(849, SRC) },
    { name: 'Jawline / Beard Area', slug: 'di-jawline', category: 'hair_removal', duration_minutes: 20, prices: base(999, SRC) },
    { name: 'Full Face', slug: 'di-full-face', category: 'hair_removal', duration_minutes: 45, prices: base(1849, SRC) },
    { name: 'Underarms', slug: 'di-underarm', category: 'hair_removal', duration_minutes: 30, prices: base(999, SRC) },
    { name: 'Half Arms', slug: 'di-half-arms', category: 'hair_removal', duration_minutes: 45, prices: base(1799, SRC) },
    { name: 'Full Arms', slug: 'di-full-arms', category: 'hair_removal', duration_minutes: 60, prices: base(2499, SRC) },
    { name: 'Half Legs', slug: 'di-half-legs', category: 'hair_removal', duration_minutes: 60, prices: base(2249, SRC) },
    { name: 'Full Legs', slug: 'di-full-legs', category: 'hair_removal', duration_minutes: 90, prices: base(3399, SRC) },
    { name: 'Bikini Line', slug: 'di-bikini-line', category: 'hair_removal', duration_minutes: 30, prices: base(1549, SRC) },
    { name: 'Brazilian', slug: 'di-brazilian', category: 'hair_removal', duration_minutes: 45, prices: base(1649, SRC) },
    { name: 'Chest', slug: 'di-chest', category: 'hair_removal', duration_minutes: 45, prices: base(2599, SRC) },
    { name: 'Abdomen', slug: 'di-abdomen', category: 'hair_removal', duration_minutes: 45, prices: base(2599, SRC) },
    { name: 'Lower Back (Midline)', slug: 'di-lower-back', category: 'hair_removal', duration_minutes: 30, prices: base(1549, SRC) },
    { name: 'Inner Thigh / Under Buttocks', slug: 'di-inner-thigh', category: 'hair_removal', duration_minutes: 30, prices: base(1349, SRC) },
    { name: 'Full Back', slug: 'di-full-back', category: 'hair_removal', duration_minutes: 60, prices: base(3599, SRC) },
  ],
};

export default section;