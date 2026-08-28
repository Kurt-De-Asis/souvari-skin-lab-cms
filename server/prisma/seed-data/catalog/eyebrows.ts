import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const section: SectionDef = {
  slug: 'eyebrow-services',
  name: 'Eyebrow Services',
  display_order: 19,
  services: [
    {
      name: 'Eyebrow Lamination',
      slug: 'eyebrow-lamination',
      category: 'other',
      duration_minutes: 45,
      prices: [{ audience: 'regular', amount: 800 }],
    },
    {
      name: 'Eyebrow Tint',
      slug: 'eyebrow-tint',
      category: 'other',
      duration_minutes: 30,
      prices: vipNm(400, 500),
    },
    {
      name: 'Eyebrow Wax',
      slug: 'eyebrow-wax',
      category: 'other',
      duration_minutes: 15,
      prices: vipNm(300, 350),
    },
    {
      name: 'Eyebrow Trim',
      slug: 'eyebrow-trim',
      category: 'other',
      duration_minutes: 15,
      prices: vipNm(200, 250),
    },
    {
      name: 'Brow Lamination + Tint',
      slug: 'brow-lamination-tint',
      category: 'other',
      duration_minutes: 45,
      prices: vipNm(1100, 1300),
    },
    {
      name: 'Brow Lamination + Wax + Trim',
      slug: 'brow-lamination-wax-trim',
      category: 'other',
      duration_minutes: 45,
      prices: vipNm(1200, 1400),
    },
    {
      name: 'Brow Lamination + Wax + Trim + Tint',
      slug: 'brow-lamination-wax-trim-tint',
      category: 'other',
      duration_minutes: 60,
      prices: vipNm(1500, 1700),
    },
  ],
};

export default section;
