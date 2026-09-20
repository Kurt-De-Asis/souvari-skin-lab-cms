import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.41 · Spa Add-ons (Hand & Foot)';

const section: SectionDef = {
  slug: 'spa-addons',
  name: 'Spa Add-ons (Hand & Foot)',
  display_order: 17,
  is_bookable: false,
  services: [
    { name: 'Harmony Hand Massage (15min)', slug: 'sa-harmony-hand-massage', category: 'other', duration_minutes: 15, prices: vipNm(119, 149, { source_ref: SRC }) },
    { name: 'Harmony Foot Massage (15min)', slug: 'sa-harmony-foot-massage', category: 'other', duration_minutes: 15, prices: vipNm(134, 179, { source_ref: SRC }) },
    { name: 'Hand and Arm Massage (30min)', slug: 'sa-hand-arm-massage', category: 'other', duration_minutes: 30, prices: vipNm(224, 299, { source_ref: SRC }) },
    { name: 'Foot and Leg Massage (30min)', slug: 'sa-foot-leg-massage', category: 'other', duration_minutes: 30, prices: vipNm(262, 349, { source_ref: SRC }) },
    { name: 'Hot Stone Hand Therapy', slug: 'sa-hot-stone-hand', category: 'other', duration_minutes: 15, prices: vipNm(149, 199, { source_ref: SRC }) },
    { name: 'Hot Stone Foot Therapy', slug: 'sa-hot-stone-foot', category: 'other', duration_minutes: 15, prices: vipNm(172, 229, { source_ref: SRC }) },
    { name: 'Callus Removal (15min)', slug: 'sa-callus-removal', category: 'other', duration_minutes: 15, prices: vipNm(112, 149, { source_ref: SRC }) },
    { name: 'Standalone Paraffin Hand Therapy', slug: 'sa-paraffin-hand', category: 'other', duration_minutes: 20, prices: vipNm(299, 399, { source_ref: SRC }) },
    { name: 'Standalone Paraffin Foot Therapy', slug: 'sa-paraffin-foot', category: 'other', duration_minutes: 20, prices: vipNm(337, 449, { source_ref: SRC }) },
    { name: 'Jelly Soak Upgrade (Foot Spa)', slug: 'sa-jelly-soak-upgrade', category: 'other', duration_minutes: 10, prices: vipNm(187, 249, { source_ref: SRC }) },
    { name: 'Herbal Foot Soak Upgrade', slug: 'sa-herbal-foot-soak', category: 'other', duration_minutes: 10, prices: vipNm(97, 129, { source_ref: SRC }) },
  ],
};

export default section;