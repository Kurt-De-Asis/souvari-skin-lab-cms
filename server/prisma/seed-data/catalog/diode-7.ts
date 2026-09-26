import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README 9 · 7 Session Series DIODE Laser Hair Removal';

type Row = [string, string, number];

const rows: Row[] = [
  ['7 Sess. - Diode · Upper lIP / Lower lip', 'sp-di-upper-lip-7', 3902],
  ['7 Sess. - Diode · Chin', 'sp-di-chin-7', 5202],
  ['7 Sess. - Diode · SideBurns / Cheeks', 'sp-di-sideburns-7', 4754],
  ['7 Sess. - Diode · Jawline / Beard Area', 'sp-di-jawline-7', 5594],
  ['7 Sess. - Diode · Full Face', 'sp-di-full-face-7', 10354],
  ['7 Sess. - Diode · Underarm', 'sp-di-underarm-7', 5594],
  ['7 Sess. - Diode · Half Arm', 'sp-di-half-arm-7', 10074],
  ['7 Sess. - Diode + Full Arm', 'sp-di-full-arm-7', 13994],
  ['7 Sess. - Diode + Half legs', 'sp-di-half-legs-7', 12594],
  ['7 Sess. - Diode + Full legs', 'sp-di-full-legs-7', 19034],
  ['7 Sess. - Diode + Bikini Line', 'sp-di-bikini-7', 8674],
  ['7 Sess. - Diode + Brazillian', 'sp-di-brazilian-7', 9234],
  ['7 Sess. - Diode + Chest', 'sp-di-chest-7', 14554],
  ['7 Sess. - Diode + Abdomen', 'sp-di-abdomen-7', 14554],
  ['7 Sess. - Diode + Lower Back (Midline)', 'sp-di-lower-back-7', 8674],
  ['7 Sess. - Diode + Inner Thigh / Under Buttocks', 'sp-di-inner-thigh-7', 7554],
  ['7 Sess. - Diode · Full Back', 'sp-di-full-back-7', 20154],
];

const section: SectionDef = {
  slug: 'diode-7-sessions',
  name: '7 Session Series DIODE Laser Hair Removal',
  display_order: 9,
  services: rows.map(([name, slug, price]) => ({
    name,
    slug,
    category: 'package',
    duration_minutes: 60,
    inclusions: [name.replace(/^\d Sess\.\s*-\s*Diode\s*[+·]\s*/i, '7 Sess. Diode ')],
    prices: base(price, SRC),
    package: {
      sessions_included: 7,
      session_price: Math.round(price / 7 * 100) / 100,
    },
  })),
};

export default section;