import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.7 · DIODE Laser Hair Removal';

const section: SectionDef = {
  slug: 'diode-laser',
  name: 'DIODE Laser Hair Removal',
  display_order: 4,
  services: [
    { name: 'Upper Lip / Lower Lip', slug: 'di-upper-lip', category: 'hair_removal', duration_minutes: 15, prices: vipNm(509, 679, { source_ref: SRC }) },
    { name: 'Chin', slug: 'di-chin', category: 'hair_removal', duration_minutes: 15, prices: vipNm(697, 929, { source_ref: SRC }) },
    { name: 'Sideburns / Cheeks', slug: 'di-sideburns', category: 'hair_removal', duration_minutes: 20, prices: vipNm(637, 849, { source_ref: SRC }) },
    { name: 'Jawline / Beard Area', slug: 'di-jawline', category: 'hair_removal', duration_minutes: 20, prices: vipNm(749, 999, { source_ref: SRC }) },
    { name: 'Full Face', slug: 'di-full-face', category: 'hair_removal', duration_minutes: 45, prices: vipNm(1387, 1849, { source_ref: SRC }) },
    { name: 'Underarms', slug: 'di-underarm', category: 'hair_removal', duration_minutes: 30, prices: vipNm(749, 999, { source_ref: SRC }) },
    { name: 'Half Arms', slug: 'di-half-arms', category: 'hair_removal', duration_minutes: 45, prices: vipNm(1349, 1799, { source_ref: SRC }) },
    { name: 'Full Arms', slug: 'di-full-arms', category: 'hair_removal', duration_minutes: 60, prices: vipNm(1874, 2499, { source_ref: SRC }) },
    { name: 'Half Legs', slug: 'di-half-legs', category: 'hair_removal', duration_minutes: 60, prices: vipNm(1687, 2249, { source_ref: SRC }) },
    { name: 'Full Legs', slug: 'di-full-legs', category: 'hair_removal', duration_minutes: 90, prices: vipNm(2549, 3399, { source_ref: SRC }) },
    { name: 'Bikini Line', slug: 'di-bikini-line', category: 'hair_removal', duration_minutes: 30, prices: vipNm(1162, 1549, { source_ref: SRC }) },
    { name: 'Brazilian', slug: 'di-brazilian', category: 'hair_removal', duration_minutes: 45, prices: vipNm(1237, 1649, { source_ref: SRC }) },
    { name: 'Chest', slug: 'di-chest', category: 'hair_removal', duration_minutes: 45, prices: vipNm(1949, 2599, { source_ref: SRC }) },
    { name: 'Abdomen', slug: 'di-abdomen', category: 'hair_removal', duration_minutes: 45, prices: vipNm(1949, 2599, { source_ref: SRC }) },
    { name: 'Lower Back (Midline)', slug: 'di-lower-back', category: 'hair_removal', duration_minutes: 30, prices: vipNm(1162, 1549, { source_ref: SRC }) },
    { name: 'Inner Thigh / Under Buttocks', slug: 'di-inner-thigh', category: 'hair_removal', duration_minutes: 30, prices: vipNm(1012, 1349, { source_ref: SRC }) },
    { name: 'Full Back', slug: 'di-full-back', category: 'hair_removal', duration_minutes: 60, prices: vipNm(2699, 3599, { source_ref: SRC }) },
  ],
};

export default section;