import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README 2 · CARBON LASER BODY WHITENING';

const section: SectionDef = {
  slug: 'body-whitening',
  name: 'CARBON LASER BODY WHITENING',
  display_order: 2,
  services: [
    { name: 'Underarms – Carbon Laser Whitening', slug: 'bw-underarm-carbon', category: 'body', duration_minutes: 30, prices: base(799, SRC) },
    { name: 'Elbows – Carbon Laser Whitening', slug: 'bw-elbow-carbon', category: 'body', duration_minutes: 30, prices: base(799, SRC) },
    { name: 'Neck / Nape – Carbon Laser Whitening', slug: 'bw-neck-carbon', category: 'body', duration_minutes: 30, prices: base(1050, SRC) },
    { name: 'Bikini Area – Carbon Laser Whitening', slug: 'bw-bikini-carbon', category: 'body', duration_minutes: 30, prices: base(1199, SRC) },
    { name: 'Knees – Carbon Laser Whitening', slug: 'bw-knee-carbon', category: 'body', duration_minutes: 30, prices: base(1199, SRC) },
    { name: 'Buttocks – Carbon Laser Whitening', slug: 'bw-buttocks-carbon', category: 'body', duration_minutes: 30, prices: base(1199, SRC) },
    { name: 'Underarm Diamond Peel + Carbon Laser Whitening', slug: 'bw-underarm-diamond-peel-carbon', category: 'body', duration_minutes: 45, inclusions: ['Underarm Diamond Peel', 'Carbon Laser Whitening'], prices: base(1499, SRC) },
  ],
};

export default section;