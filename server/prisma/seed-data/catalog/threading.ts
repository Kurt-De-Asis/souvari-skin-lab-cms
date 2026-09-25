import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README §16 · THREADING';

const section: SectionDef = {
  slug: 'threading',
  name: 'THREADING',
  display_order: 16,
  services: [
    { name: 'Chin Threading', slug: 'th-chin', category: 'other', duration_minutes: 10, prices: base(250, SRC) },
    { name: 'Upper Lip Threading', slug: 'th-upper-lip', category: 'other', duration_minutes: 10, prices: base(259, SRC) },
    { name: "Women's Eyebrow Threading", slug: 'th-eyebrow-women', category: 'other', duration_minutes: 15, prices: base(349, SRC) },
    { name: "Men's Eyebrow Threading (Natural Grooming)", slug: 'th-eyebrow-men', category: 'other', duration_minutes: 15, prices: base(399, SRC) },
    { name: 'Eyebrow Threading + Trim', slug: 'th-eyebrow-trim', category: 'other', duration_minutes: 20, prices: base(450, SRC) },
    { name: 'Full Face Threading', slug: 'th-full-face', category: 'other', duration_minutes: 45, prices: base(1200, SRC) },
  ],
};

export default section;