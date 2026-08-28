import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const section: SectionDef = {
  slug: 'beauty-enhancers',
  name: 'Beauty Enhancers',
  display_order: 5,
  services: [
    {
      name: 'Glutathione Push',
      slug: 'glutathione-push',
      category: 'injection',
      duration_minutes: 30,
      prices: vipNm(1500, 2000),
    },
    {
      name: 'Placenta Push',
      slug: 'placenta-push',
      category: 'injection',
      duration_minutes: 30,
      prices: vipNm(1500, 2000),
    },
    {
      name: 'Vitamin C Push',
      slug: 'vitamin-c-push',
      category: 'injection',
      duration_minutes: 30,
      prices: vipNm(800, 1000),
    },
    {
      name: 'Biotin Push',
      slug: 'biotin-push',
      category: 'injection',
      duration_minutes: 30,
      prices: vipNm(1000, 1500),
    },
    {
      name: 'Collagen Push',
      slug: 'collagen-push',
      category: 'injection',
      duration_minutes: 30,
      prices: vipNm(1500, 2000),
    },
    {
      name: 'Fat Burner Injection',
      slug: 'fat-burner-injection',
      category: 'injection',
      duration_minutes: 30,
      prices: vipNm(1500, 2000),
    },
    {
      name: 'Stem Cell Injection',
      slug: 'stem-cell-injection',
      category: 'injection',
      duration_minutes: 30,
      prices: vipNm(3000, 4000),
    },
    {
      name: 'Dripping Therapy',
      slug: 'dripping-therapy',
      category: 'injection',
      duration_minutes: 30,
      prices: vipNm(3000, 4000),
    },
    {
      name: 'Whitening Drip',
      slug: 'whitening-drip',
      category: 'injection',
      duration_minutes: 30,
      prices: vipNm(3000, 4000),
    },
    {
      name: 'Oxygen Treatment',
      slug: 'oxygen-treatment',
      category: 'injection',
      duration_minutes: 30,
      prices: vipNm(1000, 1500),
    },
  ],
};

export default section;
