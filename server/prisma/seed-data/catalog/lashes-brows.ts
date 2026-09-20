import { SectionDef } from '../types';
import { lashTiers, vipNm } from '../helpers';

const SRC = 'PDF p.42-44 · Lash Extensions – By Certified Technicians';

const section: SectionDef = {
  slug: 'lashes-brows',
  name: 'Lashes & Brows',
  display_order: 18,
  services: [
    { name: 'Eyelash Extension Removal', slug: 'lb-extension-removal', category: 'other', duration_minutes: 30, prices: vipNm(337, 449, { source_ref: SRC }) },
    { name: 'Celebrity Keratin Eyelash Lift w/ Tint', slug: 'lb-keratin-lift-tint', category: 'other', duration_minutes: 60, prices: vipNm(637, 849, { source_ref: SRC }) },
    { name: 'Brow Lamination "Andrea\'s Brows" - with Tint', slug: 'lb-brow-lamination-tint', category: 'other', duration_minutes: 60, prices: vipNm(674, 899, { source_ref: SRC }) },
    { name: 'Classic Eyelash Extension', slug: 'lb-classic-extension', category: 'other', duration_minutes: 120, prices: lashTiers(637, null, 849, null, { source_ref: SRC }) },
    { name: 'Hybrid Eyelash Extension', slug: 'lb-hybrid-extension', category: 'other', duration_minutes: 120, prices: lashTiers(937, null, 1249, null, { source_ref: SRC }) },
    { name: 'Volume Eyelash Extensions - the "LA Look"', slug: 'lb-volume-extension', category: 'other', duration_minutes: 150, prices: lashTiers(1162, 1499, 1549, 1999, { source_ref: SRC }) },
    { name: 'Russian Volume Eyelash Extension', slug: 'lb-russian-volume-extension', category: 'other', duration_minutes: 150, prices: lashTiers(1424, 2209, 1899, 2599, { source_ref: SRC }) },
    { name: 'Mega Volume Eyelash Extension', slug: 'lb-mega-volume-extension', category: 'other', duration_minutes: 180, prices: lashTiers(1799, 2549, 2399, 2999, { source_ref: SRC }) },
  ],
};

export default section;