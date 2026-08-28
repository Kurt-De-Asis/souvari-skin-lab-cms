import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const section: SectionDef = {
  slug: 'ultratight-hifu',
  name: 'UltraTight HIFU',
  display_order: 6,
  services: [
    {
      name: 'Eye Infra',
      slug: 'eye-infra',
      category: 'laser',
      duration_minutes: 30,
      prices: vipNm(4000, 5000),
    },
    {
      name: 'Lower Face',
      slug: 'lower-face',
      category: 'laser',
      duration_minutes: 30,
      prices: vipNm(6000, 8000),
    },
    {
      name: 'Upper Face',
      slug: 'upper-face',
      category: 'laser',
      duration_minutes: 30,
      prices: vipNm(6000, 8000),
    },
    {
      name: 'Double Chin',
      slug: 'double-chin',
      category: 'laser',
      duration_minutes: 30,
      prices: vipNm(6000, 8000),
    },
    {
      name: 'Full Face',
      slug: 'hifu-full-face',
      category: 'laser',
      duration_minutes: 45,
      prices: vipNm(12000, 15000),
    },
    {
      name: 'Full Face + Neck',
      slug: 'full-face-neck',
      category: 'laser',
      duration_minutes: 60,
      prices: vipNm(14000, 18000),
    },
    {
      name: 'Neck Lifting',
      slug: 'neck-lifting',
      category: 'laser',
      duration_minutes: 30,
      prices: vipNm(8000, 10000),
    },
    {
      name: 'Neck Infra',
      slug: 'neck-infra',
      category: 'laser',
      duration_minutes: 30,
      prices: vipNm(4000, 5000),
    },
    {
      name: 'Décolletage Infra',
      slug: 'decolletage-infra',
      category: 'laser',
      duration_minutes: 30,
      prices: vipNm(4000, 5000),
    },
    {
      name: 'Underarms',
      slug: 'underarms',
      category: 'laser',
      duration_minutes: 30,
      prices: vipNm(6000, 8000),
    },
    {
      name: 'Upper Arms',
      slug: 'upper-arms',
      category: 'laser',
      duration_minutes: 45,
      prices: vipNm(8000, 10000),
    },
    {
      name: 'Lower Arms',
      slug: 'lower-arms',
      category: 'laser',
      duration_minutes: 45,
      prices: vipNm(8000, 10000),
    },
    {
      name: 'Upper Arms + Lower Arms',
      slug: 'upper-arms-lower-arms',
      category: 'laser',
      duration_minutes: 60,
      prices: vipNm(15000, 18000),
    },
  ],
};

export default section;
