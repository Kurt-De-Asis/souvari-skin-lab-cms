import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README §7 · 7 Session Series · RF';

type Row = [string, string, number];

const rows: Row[] = [
  ['7 Sess. Double Chin', 'sp-rf-double-chin-7', 7500],
  ['7 Sess. Neck', 'sp-rf-neck-7', 7500],
  ['7 Sess. Face', 'sp-rf-face-7', 10000],
  ['7 Sess. Face + Neck', 'sp-rf-face-neck-7', 12500],
  ['7 Sess. Underarms', 'sp-rf-underarms-7', 7500],
  ['7 Sess. Upper Arms', 'sp-rf-upper-arms-7', 12500],
  ['7 Sess. Bra Fat', 'sp-rf-bra-fat-7', 10000],
  ['7 Sess. Abdomen', 'sp-rf-abdomen-7', 15000],
  ['7 Sess. Waist/Love Handles', 'sp-rf-waist-7', 12500],
  ['7 Sess. Abdomen + Waist', 'sp-rf-abdomen-waist-7', 22500],
  ['7 Sess. Full Back', 'sp-rf-full-back-7', 17500],
  ['7 Sess. Buttocks', 'sp-rf-buttocks-7', 15000],
  ['7 Sess. Inner Thighs', 'sp-rf-inner-thighs-7', 15000],
  ['7 Sess. Outer Thighs', 'sp-rf-outer-thighs-7', 15000],
  ['7 Sess. Full Tights', 'sp-rf-full-thighs-7', 22500],
  ['7 Sess. Knees', 'sp-rf-knees-7', 7500],
  ['7 Sess. Calves', 'sp-rf-calves-7', 12500],
];

const section: SectionDef = {
  slug: 'rf-7-sessions',
  name: '7 Session Series · RF',
  display_order: 7,
  services: rows.map(([name, slug, price]) => ({
    name,
    slug,
    category: 'package',
    duration_minutes: 60,
    inclusions: [name.replace(/^\d Sess\.\s*/i, '')],
    prices: base(price, SRC),
    package: {
      sessions_included: 7,
      session_price: Math.round(price / 7 * 100) / 100,
    },
  })),
};

export default section;