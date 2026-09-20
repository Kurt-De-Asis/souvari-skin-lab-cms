import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.48 · Threading';

const section: SectionDef = {
  slug: 'threading',
  name: 'Threading',
  display_order: 21,
  services: [
    { name: 'Chin Threading', slug: 'th-chin', category: 'other', duration_minutes: 10, prices: vipNm(188, 250, { source_ref: SRC }) },
    { name: 'Upper Lip Threading', slug: 'th-upper-lip', category: 'other', duration_minutes: 10, prices: vipNm(195, 259, { source_ref: SRC }) },
    { name: "Women's Eyebrow Threading", slug: 'th-eyebrow-women', category: 'other', duration_minutes: 15, prices: vipNm(262, 349, { source_ref: SRC }) },
    { name: "Men's Eyebrow Threading (Natural Grooming)", slug: 'th-eyebrow-men', category: 'other', duration_minutes: 15, prices: vipNm(300, 399, { source_ref: SRC }) },
    { name: 'Eyebrow Threading + Trim', slug: 'th-eyebrow-trim', category: 'other', duration_minutes: 20, prices: vipNm(338, 450, { source_ref: SRC }) },
    { name: 'Full Face Threading', slug: 'th-full-face', category: 'other', duration_minutes: 45, prices: vipNm(900, 1200, { source_ref: SRC }) },
  ],
};

export default section;