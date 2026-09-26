import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README 6 · 3 Session Series · UltraTight®';

type Row = [string, string, number, number];

const rows: Row[] = [
  ['3 Sess. UltraTight V-Jaw & Chin Lift', 'sp-hifu-v-jaw-chin-3', 3, 9665],
  ['3 Sess. Full Face Lift: Jaw, Chin & Neck', 'sp-hifu-full-face-3', 3, 16550],
  ['3 Sess. Neck Contouring', 'sp-hifu-neck-3', 3, 8645],
  ['3 Sess. Cheeks & Nasolabial Folds', 'sp-hifu-cheeks-3', 3, 10944],
  ['3 Sess. Eye Area HIFU', 'sp-hifu-eye-3', 3, 7625],
  ['3 Sess. Arms', 'sp-hifu-arms-3', 3, 9665],
  ['3 Sess. Abdomen', 'sp-hifu-abdomen-3', 3, 22925],
  ['3 Sess. Thighs', 'sp-hifu-thighs-3', 3, 20375],
  ['3 Sess. Back', 'sp-hifu-back-3', 3, 21650],
  ['3 Sess. Buttocks', 'sp-hifu-buttocks-3', 3, 20375],
  ['3 Sess. Flanks', 'sp-hifu-flanks-3', 3, 20375],
];

const section: SectionDef = {
  slug: 'ultratight-3',
  name: '3 Session Series · UltraTight®',
  display_order: 6,
  services: rows.map(([name, slug, sessions, price]) => ({
    name,
    slug,
    category: 'package',
    duration_minutes: 60,
    inclusions: [name.replace(/^\d Sess\.\s*/i, '')],
    prices: base(price, SRC),
    package: {
      sessions_included: sessions,
      session_price: Math.round(price / sessions * 100) / 100,
    },
  })),
};

export default section;