import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README §14 · EYELASH EXTENSIONS';

const section: SectionDef = {
  slug: 'lashes-brows',
  name: 'EYELASH EXTENSIONS',
  display_order: 14,
  services: [
    { name: 'Eyelash Extension Removal', slug: 'lb-extension-removal', category: 'other', duration_minutes: 30, prices: base(449, SRC) },
    { name: 'Celebrity Keratin Eyelash Lift w/ Tint', slug: 'lb-keratin-lift-tint', category: 'other', duration_minutes: 60, prices: base(849, SRC) },
    { name: 'Brow Lamination "Andrea\'s Brows" - with Tint', slug: 'lb-brow-lamination-tint', category: 'other', duration_minutes: 60, prices: base(899, SRC) },
    { name: 'Classic Eyelash Extension', slug: 'lb-classic-extension', category: 'other', duration_minutes: 120, prices: base(849, SRC) },
    { name: 'Hybrid Eyelash Extension', slug: 'lb-hybrid-extension', category: 'other', duration_minutes: 120, prices: base(1249, SRC) },
    { name: 'Volume Eyelash Extensions – the ‘LA Look’', slug: 'lb-volume-extension', category: 'other', duration_minutes: 150, prices: base(1549, SRC) },
    { name: 'Russian Volume Eyelash Extension', slug: 'lb-russian-volume-extension', category: 'other', duration_minutes: 150, prices: base(1899, SRC) },
    { name: 'Mega Volume Eyelash Extension', slug: 'lb-mega-volume-extension', category: 'other', duration_minutes: 180, prices: base(2399, SRC) },
  ],
};

export default section;