import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const section: SectionDef = {
  slug: 'glow-combos',
  name: 'Glow Combos',
  display_order: 2,
  services: [
    {
      name: 'Dermapen + Milk Peel',
      slug: 'dermapen-milk-peel',
      category: 'signature_facial',
      duration_minutes: 60,
      inclusions: ['Dermapen', 'Milk Peel'],
      prices: vipNm(4500, 5500),
    },
    {
      name: 'Dermapen + Glow Facial',
      slug: 'dermapen-glow-facial',
      category: 'signature_facial',
      duration_minutes: 60,
      inclusions: ['Dermapen', 'Glow Facial'],
      prices: vipNm(4500, 5500),
    },
    {
      name: 'Dermapen + Rejuran',
      slug: 'dermapen-rejuran',
      category: 'signature_facial',
      duration_minutes: 60,
      inclusions: ['Dermapen', 'Rejuran'],
      prices: vipNm(6500, 8000),
    },
    {
      name: 'Glow Facial + Carbon Laser',
      slug: 'glow-facial-carbon-laser',
      category: 'signature_facial',
      duration_minutes: 60,
      inclusions: ['Glow Facial', 'Carbon Laser'],
      prices: vipNm(6500, 8000),
    },
    {
      name: 'Microdermabrasion + Milk Peel',
      slug: 'microdermabrasion-milk-peel',
      category: 'signature_facial',
      duration_minutes: 45,
      inclusions: ['Microdermabrasion', 'Milk Peel'],
      prices: vipNm(3500, 4500),
    },
    {
      name: 'Microdermabrasion + Glow Facial',
      slug: 'microdermabrasion-glow-facial',
      category: 'signature_facial',
      duration_minutes: 45,
      inclusions: ['Microdermabrasion', 'Glow Facial'],
      prices: vipNm(3500, 4500),
    },
    {
      name: 'Microdermabrasion + Rejuran',
      slug: 'microdermabrasion-rejuran',
      category: 'signature_facial',
      duration_minutes: 60,
      inclusions: ['Microdermabrasion', 'Rejuran'],
      prices: vipNm(5500, 7000),
    },
    {
      name: 'Diamond Glow Facial',
      slug: 'diamond-glow-facial',
      category: 'signature_facial',
      duration_minutes: 45,
      prices: vipNm(3000, 3500),
    },
    {
      name: 'Microdermabrasion',
      slug: 'microdermabrasion',
      category: 'signature_facial',
      duration_minutes: 30,
      prices: vipNm(2500, 3000),
    },
  ],
};

export default section;
