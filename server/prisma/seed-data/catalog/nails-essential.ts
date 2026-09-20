import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.26 · Essential Nail Care';

const section: SectionDef = {
  slug: 'nail-essential',
  name: 'Essential Nail Care',
  display_order: 9,
  services: [
    { name: 'Signature Manicure (No Polish)', slug: 'ne-signature-manicure', category: 'other', duration_minutes: 30, prices: vipNm(97, 129, { source_ref: SRC }) },
    { name: 'Signature Pedicure (No Polish)', slug: 'ne-signature-pedicure', category: 'other', duration_minutes: 40, prices: vipNm(112, 149, { source_ref: SRC }) },
    { name: 'Mani/Pedi Polish Upgrade: Regular Polish', slug: 'ne-polish-upgrade', category: 'other', duration_minutes: 10, prices: vipNm(37, 49, { source_ref: SRC }) },
    { name: 'Mani/Pedi Add-On: Classic French Tip (Regular Polish)', slug: 'ne-classic-french-tip', category: 'other', duration_minutes: 10, prices: vipNm(59, 79, { source_ref: SRC }) },
    { name: 'Polish Change – Hands (Regular)', slug: 'ne-polish-change-hands', category: 'other', duration_minutes: 20, prices: vipNm(59, 79, { source_ref: SRC }) },
    { name: 'Polish Change – Feet (Regular)', slug: 'ne-polish-change-feet', category: 'other', duration_minutes: 25, prices: vipNm(59, 79, { source_ref: SRC }) },
    { name: 'Nail Repair – Per Nail', slug: 'ne-nail-repair', category: 'other', duration_minutes: 10, prices: vipNm(74, 99, { source_ref: SRC }) },
    { name: 'Deep Extraction Add-On', slug: 'ne-deep-extraction', category: 'other', duration_minutes: 10, prices: vipNm(74, 99, { source_ref: SRC }) },
  ],
};

export default section;