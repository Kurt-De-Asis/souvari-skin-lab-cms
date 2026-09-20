import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.30 · Crystals / Rhinestones';

const section: SectionDef = {
  slug: 'nail-crystals',
  name: 'Crystals & Rhinestones',
  display_order: 13,
  services: [
    { name: 'Small Crystal / Rhinestone – 3 pcs', slug: 'nc-small-crystal', category: 'other', duration_minutes: 10, prices: vipNm(7.5, 10, { source_ref: SRC }) },
    { name: 'Medium Crystal / Rhinestone (Per Pc)', slug: 'nc-medium-crystal', category: 'other', duration_minutes: 10, prices: vipNm(34, 45, { source_ref: SRC }) },
    { name: 'Large Crystal / Rhinestone (Per Pc)', slug: 'nc-large-crystal', category: 'other', duration_minutes: 15, prices: vipNm(112, 149, { source_ref: SRC }) },
  ],
};

export default section;