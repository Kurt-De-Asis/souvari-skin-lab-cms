import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.6 · Body Whitening';

const section: SectionDef = {
  slug: 'body-whitening',
  name: 'Body Whitening',
  display_order: 3,
  services: [
    { name: 'Underarms – Carbon Laser Whitening', slug: 'bw-underarm-carbon', category: 'body', duration_minutes: 30, prices: vipNm(599, 799, { source_ref: SRC }) },
    { name: 'Elbows – Carbon Laser Whitening', slug: 'bw-elbow-carbon', category: 'body', duration_minutes: 30, prices: vipNm(599, 799, { source_ref: SRC }) },
    { name: 'Neck / Nape – Carbon Laser Whitening', slug: 'bw-neck-carbon', category: 'body', duration_minutes: 30, prices: vipNm(788, 1050, { source_ref: SRC }) },
    { name: 'Bikini Area – Carbon Laser Whitening', slug: 'bw-bikini-carbon', category: 'body', duration_minutes: 30, prices: vipNm(899, 1199, { source_ref: SRC }) },
    { name: 'Knees – Carbon Laser Whitening', slug: 'bw-knee-carbon', category: 'body', duration_minutes: 30, prices: vipNm(899, 1199, { source_ref: SRC }) },
    { name: 'Buttocks – Carbon Laser Whitening', slug: 'bw-buttocks-carbon', category: 'body', duration_minutes: 30, prices: vipNm(899, 1199, { source_ref: SRC }) },
    { name: 'Underarm Diamond Peel w/ Bleach', slug: 'bw-underarm-diamond-peel-bleach', category: 'body', duration_minutes: 30, prices: vipNm(899, 1199, { source_ref: SRC }) },
    { name: 'Underarm Diamond Peel + Carbon Laser Whitening', slug: 'bw-underarm-diamond-peel-carbon', category: 'body', duration_minutes: 45, inclusions: ['Underarm Diamond Peel', 'Carbon Laser Whitening'], prices: vipNm(1124, 1499, { source_ref: SRC }) },
  ],
};

export default section;