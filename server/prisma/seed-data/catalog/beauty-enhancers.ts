import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.8 · Beauty Enhancers';

const section: SectionDef = {
  slug: 'beauty-enhancers',
  name: 'Beauty Enhancers',
  display_order: 5,
  services: [
    { name: 'Ozone Steam & Pore Detox', slug: 'be-ozone-steam', category: 'facial', duration_minutes: 30, prices: vipNm(244, 349, { source_ref: SRC }) },
    { name: 'Mask', slug: 'be-mask', category: 'facial', duration_minutes: 20, prices: vipNm(279, 399, { source_ref: SRC }) },
    { name: 'Manual Comedone Extraction', slug: 'be-comedone-extraction', category: 'facial', duration_minutes: 30, prices: vipNm(279, 399, { source_ref: SRC }) },
    { name: 'High Frequency', slug: 'be-high-frequency', category: 'facial', duration_minutes: 20, prices: vipNm(279, 399, { source_ref: SRC }) },
    { name: 'Lymphatic Vacuum Therapy', slug: 'be-lymphatic-vacuum', category: 'facial', duration_minutes: 30, prices: vipNm(314, 449, { source_ref: SRC }) },
    { name: 'Rejuvenating Treatment', slug: 'be-rejuvenating', category: 'facial', duration_minutes: 45, prices: vipNm(384, 549, { source_ref: SRC }) },
    { name: 'LED Light Therapy', slug: 'be-led-light', category: 'facial', duration_minutes: 20, prices: vipNm(489, 699, { source_ref: SRC }) },
    { name: 'Diamond Peel', slug: 'be-diamond-peel', category: 'facial', duration_minutes: 30, prices: vipNm(524, 749, { source_ref: SRC }) },
    { name: 'Deep Pore Cleansing Trio', slug: 'be-deep-pore-cleansing', category: 'facial', duration_minutes: 45, prices: vipNm(559, 799, { source_ref: SRC }) },
    { name: 'Hydra-Oxygenating', slug: 'be-hydra-oxy', category: 'facial', duration_minutes: 30, prices: vipNm(594, 849, { source_ref: SRC }) },
  ],
};

export default section;