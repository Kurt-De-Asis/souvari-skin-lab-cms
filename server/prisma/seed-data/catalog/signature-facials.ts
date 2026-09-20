import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.4 · Signature Facials';

const section: SectionDef = {
  slug: 'signature-facials',
  name: 'Signature Facials',
  display_order: 1,
  services: [
    { name: 'Diamond Glow Classic', slug: 'sf-diamond-glow-classic', category: 'facial', duration_minutes: 60, prices: vipNm(374, 499, { source_ref: SRC }) },
    { name: 'Signature DermaClear Facial', slug: 'sf-dermaclear-facial', category: 'facial', duration_minutes: 60, prices: vipNm(599, 799, { source_ref: SRC }) },
    { name: 'Signature DermaClear+ Diamond Facial', slug: 'sf-dermaclear-diamond', category: 'facial', duration_minutes: 60, prices: vipNm(749, 999, { source_ref: SRC }) },
    { name: 'Signature DermaClear+ Mask & PDT Facial', slug: 'sf-dermaclear-mask-pdt', category: 'facial', duration_minutes: 75, prices: vipNm(937, 1249, { source_ref: SRC }) },
    { name: 'Signature Diamond DermaClear+ Mask & PDT Facial', slug: 'sf-diamond-mask-pdt', category: 'facial', duration_minutes: 75, prices: vipNm(1199, 1599, { source_ref: SRC }) },
    { name: 'Signature DermaClear+ RejuvaLight Facial', slug: 'sf-dermaclear-rejuvalight', category: 'facial', duration_minutes: 75, prices: vipNm(1349, 1799, { source_ref: SRC }) },
    { name: 'Signature DermaClear+ RejuvaLight+ Mask & PDT Facial', slug: 'sf-rejuvalight-mask-pdt', category: 'facial', duration_minutes: 90, prices: vipNm(1499, 1999, { source_ref: SRC }) },
    { name: 'Signature DermaClear+ Contour RF Facial', slug: 'sf-dermaclear-contour-rf', category: 'facial', duration_minutes: 90, prices: vipNm(1724, 2299, { source_ref: SRC }) },
    { name: 'Signature Diamond Contour RF+ Mask & PDT Facial', slug: 'sf-diamond-contour-rf-mask-pdt', category: 'facial', duration_minutes: 105, prices: vipNm(1949, 2599, { source_ref: SRC }) },
    { name: 'Signature DermaClear+ Contour RF+ Mask & PDT Facial', slug: 'sf-dermaclear-contour-rf-mask-pdt', category: 'facial', duration_minutes: 105, prices: vipNm(2099, 2799, { source_ref: SRC }) },
    { name: 'Signature DermaClear+ Clinical O2 AcneClear with Anti-Aging', slug: 'sf-o2-acneclear-antiaging', category: 'facial', duration_minutes: 90, prices: vipNm(2249, 2999, { source_ref: SRC }) },
    { name: 'Signature Diamond DermaClear+ Clinical O2 AcneClear with Anti-Aging', slug: 'sf-diamond-o2-acneclear-antiaging', category: 'facial', duration_minutes: 105, prices: vipNm(2624, 3499, { source_ref: SRC }) },
    { name: '10 in 1 HydraFacial', slug: 'sf-10in1-hydrafacial', category: 'facial', duration_minutes: 60, prices: vipNm(974, 1299, { source_ref: SRC }) },
    { name: 'Hollywood Carbon Laser Peel (Face)', slug: 'sf-hollywood-carbon-laser-peel', category: 'laser', duration_minutes: 45, prices: vipNm(1124, 1499, { source_ref: SRC }) },
    { name: 'Mild Acne Treatment w/ Mask', slug: 'sf-mild-acne-treatment', category: 'facial', duration_minutes: 60, prices: vipNm(937, 1249, { source_ref: SRC }) },
    { name: 'Severe Acne Treatment + Mask', slug: 'sf-severe-acne-treatment', category: 'facial', duration_minutes: 75, prices: vipNm(1162, 1549, { source_ref: SRC }) },
    { name: 'Mild Acne + Mask + Hydra-Oxygenating', slug: 'sf-mild-acne-hydra-oxy', category: 'facial', duration_minutes: 75, prices: vipNm(1462, 1949, { source_ref: SRC }) },
    { name: 'Severe Acne + Mask + Hydra-Oxy', slug: 'sf-severe-acne-hydra-oxy', category: 'facial', duration_minutes: 90, prices: vipNm(1649, 2199, { source_ref: SRC }) },
  ],
};

export default section;