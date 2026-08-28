import { PriceRowInput, SectionDef } from '../types';
import { vipNm, vipNmRegular } from '../helpers';

const PMU_SOURCE_REF = 'PDF · PMU ambiguous 3-tier mapping';

function pmuThreeTier(vip: number, nm: number, regular: number): PriceRowInput[] {
  const rows = vipNmRegular(vip, nm, regular);
  rows[2] = { ...rows[2], needs_verification: true, source_ref: PMU_SOURCE_REF };
  return rows;
}

const section: SectionDef = {
  slug: 'permanent-makeup',
  name: 'Permanent Makeup',
  display_order: 20,
  services: [
    {
      name: 'Microblading',
      slug: 'microblading',
      category: 'other',
      duration_minutes: 120,
      prices: pmuThreeTier(8000, 10000, 12000),
    },
    {
      name: 'Microshading',
      slug: 'microshading',
      category: 'other',
      duration_minutes: 120,
      prices: pmuThreeTier(8000, 10000, 12000),
    },
    {
      name: 'Combination Brows',
      slug: 'combination-brows',
      category: 'other',
      duration_minutes: 120,
      prices: pmuThreeTier(10000, 12000, 15000),
    },
    {
      name: 'Powder Brows',
      slug: 'powder-brows',
      category: 'other',
      duration_minutes: 120,
      prices: pmuThreeTier(8000, 10000, 12000),
    },
    {
      name: 'Nano Brows',
      slug: 'nano-brows',
      category: 'other',
      duration_minutes: 120,
      prices: pmuThreeTier(10000, 12000, 15000),
    },
    {
      name: 'Lip Blush',
      slug: 'lip-blush',
      category: 'other',
      duration_minutes: 120,
      prices: pmuThreeTier(8000, 10000, 12000),
    },
    {
      name: 'Eyeliner',
      slug: 'eyeliner',
      category: 'other',
      duration_minutes: 120,
      prices: pmuThreeTier(8000, 10000, 12000),
    },
    {
      name: 'Beauty Mark',
      slug: 'beauty-mark',
      category: 'other',
      duration_minutes: 60,
      prices: pmuThreeTier(3000, 4000, 5000),
    },
    {
      name: 'Scalp Micropigmentation',
      slug: 'scalp-micropigmentation',
      category: 'other',
      duration_minutes: 180,
      prices: pmuThreeTier(15000, 18000, 22000),
    },
    {
      name: 'Scalp Micropigmentation Hairline',
      slug: 'scalp-micropigmentation-hairline',
      category: 'other',
      duration_minutes: 180,
      prices: pmuThreeTier(15000, 18000, 22000),
    },
    {
      name: 'Freckle Tattoo',
      slug: 'freckle-tattoo',
      category: 'other',
      duration_minutes: 60,
      prices: pmuThreeTier(3000, 4000, 5000),
    },
    {
      name: 'Areola Micropigmentation',
      slug: 'areola-micropigmentation',
      category: 'other',
      duration_minutes: 120,
      prices: vipNm(10000, 12000),
    },
    {
      name: 'Scar Camouflage',
      slug: 'scar-camouflage',
      category: 'other',
      duration_minutes: 120,
      prices: vipNm(10000, 12000),
    },
    {
      name: 'Stretch Mark Camouflage',
      slug: 'stretch-mark-camouflage',
      category: 'other',
      duration_minutes: 180,
      prices: vipNm(15000, 18000),
    },
  ],
};

export default section;
