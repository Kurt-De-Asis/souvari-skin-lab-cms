import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const section: SectionDef = {
  slug: 'spa-addons',
  name: 'Spa Addons',
  display_order: 17,
  is_bookable: false,
  services: [
    {
      name: 'Whitening',
      slug: 'whitening-addon',
      category: 'other',
      duration_minutes: 15,
      prices: vipNm(200, 250),
    },
    {
      name: 'Whitening + Para Film',
      slug: 'whitening-para-film-addon',
      category: 'other',
      duration_minutes: 20,
      prices: vipNm(300, 350),
    },
    {
      name: 'Paraffin',
      slug: 'paraffin-addon',
      category: 'other',
      duration_minutes: 15,
      prices: vipNm(200, 250),
    },
    {
      name: 'Extra Mask',
      slug: 'extra-mask',
      category: 'other',
      duration_minutes: 10,
      prices: vipNm(200, 250),
    },
    {
      name: 'Extra Scrub',
      slug: 'extra-scrub',
      category: 'other',
      duration_minutes: 10,
      prices: vipNm(150, 200),
    },
    {
      name: 'Extra Massage',
      slug: 'extra-massage',
      category: 'other',
      duration_minutes: 10,
      prices: vipNm(150, 200),
    },
    {
      name: 'Nail Art',
      slug: 'nail-art-addon',
      category: 'other',
      duration_minutes: 15,
      prices: vipNm(250, 350),
    },
    {
      name: 'French Tips',
      slug: 'french-tips-addon',
      category: 'other',
      duration_minutes: 15,
      prices: vipNm(200, 250),
    },
    {
      name: 'Full Set',
      slug: 'full-set-addon',
      category: 'other',
      duration_minutes: 30,
      prices: vipNm(350, 450),
    },
    {
      name: 'Crystal',
      slug: 'crystal-addon',
      category: 'other',
      duration_minutes: 10,
      prices: vipNm(100, 150),
    },
    {
      name: 'Extension',
      slug: 'extension-addon',
      category: 'other',
      duration_minutes: 30,
      prices: vipNm(300, 350),
    },
  ],
};

export default section;
