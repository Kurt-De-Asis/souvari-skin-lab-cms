import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.5 · Glow Combos';

const section: SectionDef = {
  slug: 'glow-combos',
  name: 'Glow Combos',
  display_order: 2,
  services: [
    {
      name: 'Signature DermaClear+ Carbon Laser & PDT',
      slug: 'gc-dermaclear-carbon-pdt',
      category: 'facial',
      duration_minutes: 90,
      inclusions: ['Signature DermaClear', 'Carbon Laser', 'PDT'],
      prices: vipNm(1499, 1999, { source_ref: SRC }),
    },
    {
      name: 'Signature DermaClear+ Carbon Laser + Mask & PDT',
      slug: 'gc-dermaclear-carbon-mask-pdt',
      category: 'facial',
      duration_minutes: 105,
      inclusions: ['Signature DermaClear', 'Carbon Laser', 'Mask', 'PDT'],
      prices: vipNm(1799, 2399, { source_ref: SRC }),
    },
    {
      name: '10-in-1 HydraFacial + Hollywood Carbon Laser Peel, Mask & PDT',
      slug: 'gc-hydrafacial-carbon-mask-pdt',
      category: 'facial',
      duration_minutes: 120,
      inclusions: ['10-in-1 HydraFacial', 'Hollywood Carbon Laser Peel', 'Mask', 'PDT'],
      prices: vipNm(1949, 2599, { source_ref: SRC }),
    },
    {
      name: 'Signature DermaClear+ Carbon Laser + Diamond Peel + Mask & PDT',
      slug: 'gc-dermaclear-carbon-diamond-peel',
      category: 'facial',
      duration_minutes: 120,
      inclusions: ['Signature DermaClear', 'Carbon Laser', 'Diamond Peel', 'Mask', 'PDT'],
      prices: vipNm(2174, 2899, { source_ref: SRC }),
    },
    {
      name: 'Signature DermaClear+ Diamond Peel + Hydra-Oxy + Mask & PDT',
      slug: 'gc-dermaclear-diamond-hydra-oxy',
      category: 'facial',
      duration_minutes: 120,
      inclusions: ['Signature DermaClear', 'Diamond Peel', 'Hydra-Oxy', 'Mask', 'PDT'],
      prices: vipNm(2474, 3299, { source_ref: SRC }),
    },
    {
      name: 'Underarms – Carbon Laser Whitening + IPL Hair Removal',
      slug: 'gc-underarm-carbon-ipl',
      category: 'body',
      duration_minutes: 60,
      inclusions: ['Carbon Laser Whitening (Underarms)', 'IPL Hair Removal'],
      prices: vipNm(974, 1298, { source_ref: SRC }),
    },
    {
      name: 'Underarms – Carbon Laser Whitening + Diode Hair Removal',
      slug: 'gc-underarm-carbon-diode',
      category: 'body',
      duration_minutes: 60,
      inclusions: ['Carbon Laser Whitening (Underarms)', 'Diode Hair Removal'],
      prices: vipNm(1086, 1448, { source_ref: SRC }),
    },
    {
      name: 'Underarm Diamond Peel + Carbon Laser Whitening + IPL Hair Removal',
      slug: 'gc-underarm-diamond-peel-carbon-ipl',
      category: 'body',
      duration_minutes: 90,
      inclusions: ['Underarm Diamond Peel', 'Carbon Laser Whitening', 'IPL Hair Removal'],
      prices: vipNm(1499, 1998, { source_ref: SRC }),
    },
    {
      name: 'Underarm Diamond Peel + Carbon Laser Whitening + Diode Hair Removal',
      slug: 'gc-underarm-diamond-peel-carbon-diode',
      category: 'body',
      duration_minutes: 90,
      inclusions: ['Underarm Diamond Peel', 'Carbon Laser Whitening', 'Diode Hair Removal'],
      prices: vipNm(1611, 2148, { source_ref: SRC }),
    },
  ],
};

export default section;