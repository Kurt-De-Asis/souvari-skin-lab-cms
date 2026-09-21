import { PriceRowInput, SectionDef } from '../types';
import { vipNmRegular } from '../helpers';

const SRC = 'PDF p.45-47 · Permanent Makeup by Kim Diauna (Regular Rate / VIP 1st Session / Non-MBR 1st Session)';

function pmu(regular: number, vip: number, nm: number): { prices: PriceRowInput[] } {
  return { prices: vipNmRegular(vip, nm, regular, { source_ref: SRC }) };
}

const section: SectionDef = {
  slug: 'permanent-makeup',
  name: 'Permanent Makeup',
  display_order: 20,
  services: [
    { name: 'Eyebrow Microblading', slug: 'pm-eyebrow-microblading', category: 'other', duration_minutes: 90, description: 'Professional permanent makeup at Souvari Skin Lab.', ...pmu(9519, 5099, 6799) },
    { name: 'Ombré Powder Brows', slug: 'pm-ombre-powder-brows', category: 'other', duration_minutes: 90, ...pmu(9519, 5099, 6799) },
    { name: '6Ds Microblading', slug: 'pm-6ds-microblading', category: 'other', duration_minutes: 90, ...pmu(10219, 5474, 7299) },
    { name: 'Premium Combi Brows', slug: 'pm-premium-combi-brows', category: 'other', duration_minutes: 90, ...pmu(11619, 6224, 8299) },
    { name: 'Nano Machine Brows', slug: 'pm-nano-machine-brows', category: 'other', duration_minutes: 90, ...pmu(12319, 6599, 8799) },
    { name: 'MicroWispy Brows', slug: 'pm-microwispy-brows', category: 'other', duration_minutes: 90, ...pmu(12879, 6899, 9199) },
    { name: 'Full Lips Pigmentation', slug: 'pm-full-lips-pigmentation', category: 'other', duration_minutes: 90, ...pmu(13019, 6977, 9299) },
    { name: 'Dark Lips Color Correction', slug: 'pm-dark-lips-color-correction', category: 'other', duration_minutes: 90, ...pmu(14700, 7875, 10500) },
    { name: 'Classic Eyeliner Micropigmentation', slug: 'pm-classic-eyeliner', category: 'other', duration_minutes: 90, ...pmu(7419, 4493, 5990) },
    { name: 'Winged Eyeliner Micropigmentation', slug: 'pm-winged-eyeliner', category: 'other', duration_minutes: 90, ...pmu(10219, 5624, 7499) },
    { name: 'Dusty Eyeliner Micropigmentation', slug: 'pm-dusty-eyeliner', category: 'other', duration_minutes: 90, ...pmu(11619, 6374, 8499) },
    { name: '2nd Session PMU Touch-up (6-8 weeks)', slug: 'pm-2nd-session-touchup', category: 'other', duration_minutes: 60, ...pmu(2799, 1499, 1999) },
    { name: 'Semi-Annual Retouch Session (6-9 months)', slug: 'pm-semi-annual-retouch', category: 'other', duration_minutes: 60, ...pmu(4666, 2499, 3333) },
    { name: 'PMU Yearly Retouch Session (10-12 months)', slug: 'pm-yearly-retouch', category: 'other', duration_minutes: 60, ...pmu(6533, 3499, 4665) },
    { name: 'Extended Retouch Session (13-18 months)', slug: 'pm-extended-retouch', category: 'other', duration_minutes: 60, ...pmu(8400, 4499, 6000) },
    { name: 'PMU Color Correction', slug: 'pm-color-correction', category: 'other', duration_minutes: 30, ...pmu(2425, 1299, 1732) },
    { name: 'Tattoo Removal - Minimal Brows Tattoo', slug: 'pm-removal-minimal-brows', category: 'other', duration_minutes: 30, ...pmu(931, 499, 665) },
    { name: 'Tattoo Removal - Full Brows Tattoo', slug: 'pm-removal-full-brows', category: 'other', duration_minutes: 30, ...pmu(3731, 1999, 2665) },
  ],
};

export default section;