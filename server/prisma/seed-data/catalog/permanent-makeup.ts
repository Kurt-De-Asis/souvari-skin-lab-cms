import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README 15 · PERMANENT MAKE UP';

const section: SectionDef = {
  slug: 'permanent-makeup',
  name: 'PERMANENT MAKE UP',
  display_order: 15,
  services: [
    { name: 'Ombré Powder Brows', slug: 'pm-ombre-powder-brows', category: 'other', duration_minutes: 90, prices: base(6799, SRC) },
    { name: '6Ds Microblading', slug: 'pm-6ds-microblading', category: 'other', duration_minutes: 90, prices: base(7299, SRC) },
    { name: 'Premium Combi Brows', slug: 'pm-premium-combi-brows', category: 'other', duration_minutes: 90, prices: base(8299, SRC) },
    { name: 'Nano Machine Brows', slug: 'pm-nano-machine-brows', category: 'other', duration_minutes: 90, prices: base(8799, SRC) },
    { name: 'MicroWispy Brows', slug: 'pm-microwispy-brows', category: 'other', duration_minutes: 90, prices: base(9199, SRC) },
    { name: 'Full Lips Pigmentation', slug: 'pm-full-lips-pigmentation', category: 'other', duration_minutes: 90, prices: base(9299, SRC) },
    { name: 'Dark Lips Color Correction', slug: 'pm-dark-lips-color-correction', category: 'other', duration_minutes: 90, prices: base(10500, SRC) },
    { name: 'Classic Eyeliner Micropigmentation', slug: 'pm-classic-eyeliner', category: 'other', duration_minutes: 90, prices: base(5990, SRC) },
    { name: 'Winged Eyeliner Micropigmentation', slug: 'pm-winged-eyeliner', category: 'other', duration_minutes: 90, prices: base(7499, SRC) },
    { name: 'Dusty Eyeliner Micropigmentation', slug: 'pm-dusty-eyeliner', category: 'other', duration_minutes: 90, prices: base(8499, SRC) },
    { name: '2nd Session PMU Touch-up (6–8 weeks)', slug: 'pm-2nd-session-touchup', category: 'other', duration_minutes: 60, prices: base(1999, SRC) },
    { name: 'Semi-Annual Retouch Session (6–9 months)', slug: 'pm-semi-annual-retouch', category: 'other', duration_minutes: 60, prices: base(3333, SRC) },
    { name: 'PMU Yearly Retouch Session (10–12 months)', slug: 'pm-yearly-retouch', category: 'other', duration_minutes: 60, prices: base(4665, SRC) },
    { name: 'Extended Retouch Session (13–18 months)', slug: 'pm-extended-retouch', category: 'other', duration_minutes: 60, prices: base(6000, SRC) },
    { name: 'PMU Color Correction', slug: 'pm-color-correction', category: 'other', duration_minutes: 30, prices: base(1732, SRC) },
    { name: 'Tattoo Removal – Minimal Brows Tattoo', slug: 'pm-removal-minimal-brows', category: 'other', duration_minutes: 30, prices: base(665, SRC) },
    { name: 'Tattoo Removal – Full Brows Tattoo', slug: 'pm-removal-full-brows', category: 'other', duration_minutes: 30, prices: base(2665, SRC) },
  ],
};

export default section;