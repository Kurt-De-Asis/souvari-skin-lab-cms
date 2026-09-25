import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README §10 · ESSENTIAL NAIL CARE';

const section: SectionDef = {
  slug: 'nail-essential',
  name: 'ESSENTIAL NAIL CARE',
  display_order: 10,
  services: [
    { name: 'Signature Manicure (No polish)', slug: 'ne-signature-manicure', category: 'other', duration_minutes: 30, prices: base(129, SRC) },
    { name: 'Signature Pedicure (No polish)', slug: 'ne-signature-pedicure', category: 'other', duration_minutes: 40, prices: base(149, SRC) },
    { name: 'Mani/Pedi Polish Upgrade: Regular Polish', slug: 'ne-polish-upgrade', category: 'other', duration_minutes: 10, prices: base(49, SRC) },
    { name: 'Mani/Pedi Add-On: Classic French Tip (Regular Polish)', slug: 'ne-classic-french-tip', category: 'other', duration_minutes: 10, prices: base(79, SRC) },
    { name: 'Polish Change – Hands (Regular)', slug: 'ne-polish-change-hands', category: 'other', duration_minutes: 20, prices: base(79, SRC) },
    { name: 'Polish Change – Feet (Regular)', slug: 'ne-polish-change-feet', category: 'other', duration_minutes: 25, prices: base(79, SRC) },
    { name: 'Nail Repair – Per Nail', slug: 'ne-nail-repair', category: 'other', duration_minutes: 10, prices: base(99, SRC) },
    { name: 'Deep Extraction Add-On', slug: 'ne-deep-extraction', category: 'other', duration_minutes: 10, prices: base(99, SRC) },
  ],
};

export default section;