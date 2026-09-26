import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README 8 · 7 Session Series Body Whitening';

type Row = [string, string, number];

const rows: Row[] = [
  ['7 Sess. - Underarms Carbon Laser Whitening', 'sp-bw-underarm-carbon-7', 4754],
  ['7 Sess. - Elbow Carbon Laser Whitening', 'sp-bw-elbow-carbon-7', 4754],
  ['7 Sess. - Neck / Nape Carbon Laser Whitening', 'sp-bw-neck-carbon-7', 6248],
  ['7 Sess. - Bikini Area Carbon Laser Whitening', 'sp-bw-bikini-carbon-7', 7134],
  ['7 Sess. - Knees Carbon Laser Whitening', 'sp-bw-knee-carbon-7', 7134],
  ['7 Sess. - Buttocks Carbon Laser Whitening', 'sp-bw-buttocks-carbon-7', 7134],
  ['7 Sess. - Underarm Diamond Peel w/ Bleach', 'sp-bw-underarm-dp-bleach-7', 7134],
  ['7 Sess. - Underarm Diamond Peel + Carbon Laser Whitening', 'sp-bw-underarm-dp-carbon-7', 8919],
];

const section: SectionDef = {
  slug: 'body-whitening-7',
  name: '7 Session Series Body Whitening',
  display_order: 8,
  services: rows.map(([name, slug, price]) => ({
    name,
    slug,
    category: 'package',
    duration_minutes: 60,
    inclusions: [name.replace(/^\d Sess\.\s*-\s*/i, '')],
    prices: base(price, SRC),
    package: {
      sessions_included: 7,
      session_price: Math.round(price / 7 * 100) / 100,
    },
  })),
};

export default section;