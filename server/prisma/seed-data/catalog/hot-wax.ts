import { SectionDef } from '../types';
import { waxVipNm4 } from '../helpers';

const SRC = 'PDF p.49-52 · Hot Wax Hair Removal by Certified Aesthetician';

const section: SectionDef = {
  slug: 'hot-wax',
  name: 'Hot Wax Hair Removal',
  display_order: 22,
  services: [
    {
      name: 'Velvet Allure – Full Leg, Underarm, Brazilian',
      slug: 'hx-velvet-allure',
      category: 'package',
      duration_minutes: 90,
      inclusions: ['Full Leg Wax', 'Underarm Wax', 'Brazilian Wax'],
      prices: waxVipNm4(1619, 1799, 1799, 1999),
    },
    {
      name: 'Silken Curve – Half Leg, Underarm, Brazilian',
      slug: 'hx-silken-curve',
      category: 'package',
      duration_minutes: 75,
      inclusions: ['Half Leg Wax', 'Underarm Wax', 'Brazilian Wax'],
      prices: waxVipNm4(1439, 1619, 1599, 1799),
    },
    {
      name: 'Contour Glow – Eyebrow Threading, Underarm, Brazilian',
      slug: 'hx-contour-glow',
      category: 'package',
      duration_minutes: 70,
      inclusions: ['Eyebrow Threading', 'Underarm Wax', 'Brazilian Wax'],
      prices: waxVipNm4(1169, 1349, 1299, 1499),
    },
    {
      name: 'Frame Silque – Half Leg, Underarm, Eyebrow Threading',
      slug: 'hx-frame-silque',
      category: 'package',
      duration_minutes: 60,
      inclusions: ['Half Leg Wax', 'Underarm Wax', 'Eyebrow Threading'],
      prices: waxVipNm4(989, 1169, 1099, 1299),
    },
    {
      name: 'Luxe Gaze – Eyebrow, Underarm, Eyelash Perming',
      slug: 'hx-luxe-gaze',
      category: 'package',
      duration_minutes: 60,
      inclusions: ['Eyebrow Threading', 'Underarm Wax', 'Eyelash Perming'],
      prices: waxVipNm4(899, null, 999, null),
    },
    {
      name: 'Pure Define – Lip & Eyebrow Threading, Underarm',
      slug: 'hx-pure-define',
      category: 'package',
      duration_minutes: 50,
      inclusions: ['Lip & Eyebrow Threading', 'Underarm Wax'],
      prices: waxVipNm4(1079, 1214, 1199, 1349),
    },
    { name: 'Underarm', slug: 'hx-underarm', category: 'body', duration_minutes: 20, prices: waxVipNm4(287, 351, 359, 439) },
    { name: 'Brazilian', slug: 'hx-brazilian', category: 'body', duration_minutes: 45, prices: waxVipNm4(759, 895, 949, 1119) },
    { name: 'Full Face (Brow, Lip, Chin, Neck)', slug: 'hx-full-face', category: 'body', duration_minutes: 30, prices: waxVipNm4(639, 799, 799, 999) },
    { name: 'Full Back', slug: 'hx-full-back', category: 'body', duration_minutes: 45, prices: waxVipNm4(719, 900, 899, 1125) },
    { name: 'Full Leg', slug: 'hx-full-leg', category: 'body', duration_minutes: 60, prices: waxVipNm4(655, 775, 819, 969) },
    { name: 'Back (Upper/Lower)', slug: 'hx-back-upper-lower', category: 'body', duration_minutes: 30, prices: waxVipNm4(599, 743, 749, 929) },
    { name: 'Bikini', slug: 'hx-bikini', category: 'body', duration_minutes: 30, prices: waxVipNm4(519, 631, 649, 789) },
    
    { name: 'Half Leg', slug: 'hx-half-leg', category: 'body', duration_minutes: 45, prices: waxVipNm4(479, 599, 599, 749) },
    { name: 'Full Arm', slug: 'hx-full-arm', category: 'body', duration_minutes: 45, prices: waxVipNm4(599, 759, 749, 949) },
    { name: 'Tummy / Stomach', slug: 'hx-tummy-stomach', category: 'body', duration_minutes: 30, prices: waxVipNm4(399, 479, 499, 599) },
    { name: 'Half Arm', slug: 'hx-half-arm', category: 'body', duration_minutes: 30, prices: waxVipNm4(439, 543, 549, 679) },
    { name: 'Chest', slug: 'hx-chest', category: 'body', duration_minutes: 30, prices: waxVipNm4(447, 559, 559, 699) },
    { name: 'Shoulders', slug: 'hx-shoulders', category: 'body', duration_minutes: 20, prices: waxVipNm4(439, 543, 549, 679) },
    { name: 'Neck', slug: 'hx-neck', category: 'body', duration_minutes: 15, prices: waxVipNm4(319, 383, 399, 479) },
    { name: 'Lip (Upper & Lower)', slug: 'hx-lip', category: 'body', duration_minutes: 10, prices: waxVipNm4(151, 168, 189, 210) },
    { name: 'Chin Waxing', slug: 'hx-chin', category: 'body', duration_minutes: 10, prices: waxVipNm4(159, 199, 199, 249) },
    { name: 'Eyebrow Design', slug: 'hx-eyebrow', category: 'body', duration_minutes: 10, prices: waxVipNm4(239, 295, 299, 369) },
    { name: 'Hands / Fingers', slug: 'hx-hands', category: 'body', duration_minutes: 15, prices: waxVipNm4(159, 199, 199, 249) },
    { name: 'Feet / Toes', slug: 'hx-feet', category: 'body', duration_minutes: 15, prices: waxVipNm4(199, 247, 249, 309) },
  ],
};

export default section;