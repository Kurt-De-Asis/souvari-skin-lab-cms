import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const section: SectionDef = {
  slug: 'threading',
  name: 'Threading',
  display_order: 21,
  services: [
    {
      name: 'Upper Lip',
      slug: 'upper-lip',
      category: 'other',
      duration_minutes: 10,
      prices: vipNm(100, 150),
    },
    {
      name: 'Eyebrow',
      slug: 'eyebrow',
      category: 'other',
      duration_minutes: 15,
      prices: vipNm(150, 200),
    },
    {
      name: 'Chin',
      slug: 'chin',
      category: 'other',
      duration_minutes: 10,
      prices: vipNm(100, 150),
    },
    {
      name: 'Full Face',
      slug: 'full-face',
      category: 'other',
      duration_minutes: 30,
      prices: vipNm(500, 600),
    },
    {
      name: 'Side Burns',
      slug: 'side-burns',
      category: 'other',
      duration_minutes: 15,
      prices: vipNm(200, 250),
    },
    {
      name: 'Forehead',
      slug: 'forehead',
      category: 'other',
      duration_minutes: 10,
      prices: vipNm(100, 150),
    },
  ],
};

export default section;
