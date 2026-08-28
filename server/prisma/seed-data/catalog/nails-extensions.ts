import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const section: SectionDef = {
  slug: 'nail-extensions',
  name: 'Nail Extensions',
  display_order: 11,
  services: [
    { name: 'Regular Tips with Gel', slug: 'regular-tips-gel', category: 'other', duration_minutes: 60, prices: vipNm(500, 650) },
    { name: 'Regular Tips with Polygel', slug: 'regular-tips-polygel', category: 'other', duration_minutes: 60, prices: vipNm(700, 850) },
    { name: 'Regular Tips with Acrylic', slug: 'regular-tips-acrylic', category: 'other', duration_minutes: 60, prices: vipNm(700, 850) },
    { name: 'Regular Tips with Full Cover Gel', slug: 'regular-tips-full-cover-gel', category: 'other', duration_minutes: 60, prices: vipNm(600, 750) },
    { name: 'Sculptured with Gel', slug: 'sculptured-gel', category: 'other', duration_minutes: 60, prices: vipNm(600, 750) },
    { name: 'Sculptured with Polygel', slug: 'sculptured-polygel', category: 'other', duration_minutes: 60, prices: vipNm(800, 950) },
    { name: 'Sculptured with Acrylic', slug: 'sculptured-acrylic', category: 'other', duration_minutes: 60, prices: vipNm(800, 950) },
    { name: 'Sculptured with Full Cover Gel', slug: 'sculptured-full-cover-gel', category: 'other', duration_minutes: 60, prices: vipNm(700, 850) },
  ],
};

export default section;
