import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const section: SectionDef = {
  slug: 'nail-gel',
  name: 'Nail Gel',
  display_order: 10,
  services: [
    { name: 'Gel Polish Manicure', slug: 'gel-polish-manicure', category: 'other', duration_minutes: 45, prices: vipNm(400, 500) },
    { name: 'Gel Polish Pedicure', slug: 'gel-polish-pedicure', category: 'other', duration_minutes: 45, prices: vipNm(450, 550) },
    { name: 'Gel Polish Manicure + Pedicure', slug: 'gel-polish-manicure-pedicure', category: 'other', duration_minutes: 60, prices: vipNm(800, 950) },
    { name: 'Removal Gel', slug: 'removal-gel', category: 'other', duration_minutes: 15, prices: vipNm(150, 200) },
  ],
};

export default section;
