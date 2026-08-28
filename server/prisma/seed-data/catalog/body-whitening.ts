import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const section: SectionDef = {
  slug: 'body-whitening',
  name: 'Body Whitening',
  display_order: 3,
  services: [
    {
      name: 'Underarm Whitening Treatment',
      slug: 'underarm-whitening-treatment',
      category: 'body',
      duration_minutes: 45,
      prices: vipNm(2500, 3500),
    },
    {
      name: 'Underarm Laser Treatment',
      slug: 'underarm-laser-treatment',
      category: 'body',
      duration_minutes: 30,
      prices: vipNm(2500, 3500),
    },
    {
      name: 'Inner Thigh Whitening Treatment',
      slug: 'inner-thigh-whitening-treatment',
      category: 'body',
      duration_minutes: 45,
      prices: vipNm(4500, 6000),
    },
    {
      name: 'Full Back Whitening Treatment',
      slug: 'full-back-whitening-treatment',
      category: 'body',
      duration_minutes: 45,
      prices: vipNm(6000, 8000),
    },
    {
      name: 'Full Arms Whitening Treatment',
      slug: 'full-arms-whitening-treatment',
      category: 'body',
      duration_minutes: 45,
      prices: vipNm(5000, 6000),
    },
    {
      name: 'Full Legs Whitening Treatment',
      slug: 'full-legs-whitening-treatment',
      category: 'body',
      duration_minutes: 45,
      prices: vipNm(8000, 10000),
    },
    {
      name: 'Full Body Whitening Treatment',
      slug: 'full-body-whitening-treatment',
      category: 'body',
      duration_minutes: 120,
      prices: vipNm(15000, 18000),
    },
    {
      name: 'Glowing Virgin Package',
      slug: 'glowing-virgin-package',
      category: 'package',
      duration_minutes: 120,
      prices: vipNm(30000, 40000),
      package: {
        sessions_included: 1,
        session_price: 30000,
      },
    },
  ],
};

export default section;
