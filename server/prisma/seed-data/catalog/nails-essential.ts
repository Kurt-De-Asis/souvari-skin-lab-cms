import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const section: SectionDef = {
  slug: 'nail-essential',
  name: 'Nail Essential',
  display_order: 9,
  services: [
    { name: 'Regular Nail Polish', slug: 'regular-nail-polish', category: 'other', duration_minutes: 30, prices: vipNm(150, 200) },
    { name: 'Regular Nail Polish with Top Coat', slug: 'regular-nail-polish-top-coat', category: 'other', duration_minutes: 30, prices: vipNm(180, 250) },
    { name: 'Nail Art Design', slug: 'nail-art-design', category: 'other', duration_minutes: 30, prices: vipNm(250, 350) },
    { name: 'Manicure', slug: 'manicure', category: 'other', duration_minutes: 30, prices: vipNm(200, 250) },
    { name: 'Pedicure', slug: 'pedicure', category: 'other', duration_minutes: 30, prices: vipNm(250, 300) },
    { name: 'Manicure + Regular Polish', slug: 'manicure-regular-polish', category: 'other', duration_minutes: 45, prices: vipNm(350, 450) },
    { name: 'Pedicure + Regular Polish', slug: 'pedicure-regular-polish', category: 'other', duration_minutes: 45, prices: vipNm(400, 500) },
    { name: 'Manicure + Pedicure', slug: 'manicure-pedicure', category: 'other', duration_minutes: 60, prices: vipNm(450, 550) },
  ],
};

export default section;
