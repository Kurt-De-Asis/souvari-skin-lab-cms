import { SectionDef } from '../types';

const section: SectionDef = {
  slug: 'skin-tag-removal',
  name: 'Skin Tag Removal',
  display_order: 8,
  services: [
    {
      name: 'Skin Tag Removal',
      slug: 'skin-tag-removal',
      category: 'other',
      duration_minutes: 30,
      needs_verification: true,
      prices: [
        { audience: 'vip', amount: 500, needs_verification: true, source_ref: 'PDF · Skin Tag ambiguous pricing' },
        { audience: 'non_member', amount: 700, needs_verification: true, source_ref: 'PDF · Skin Tag ambiguous pricing' },
      ],
    },
    {
      name: 'Wart Removal',
      slug: 'wart-removal',
      category: 'other',
      duration_minutes: 30,
      needs_verification: true,
      prices: [
        { audience: 'vip', amount: 500, needs_verification: true, source_ref: 'PDF · Wart ambiguous pricing' },
        { audience: 'non_member', amount: 700, needs_verification: true, source_ref: 'PDF · Wart ambiguous pricing' },
      ],
    },
    {
      name: 'Corn Removal',
      slug: 'corn-removal',
      category: 'other',
      duration_minutes: 30,
      needs_verification: true,
      prices: [
        { audience: 'vip', amount: 500, needs_verification: true, source_ref: 'PDF · Corn ambiguous pricing' },
        { audience: 'non_member', amount: 700, needs_verification: true, source_ref: 'PDF · Corn ambiguous pricing' },
      ],
    },
    {
      name: 'Callosity Removal',
      slug: 'callosity-removal',
      category: 'other',
      duration_minutes: 30,
      needs_verification: true,
      prices: [
        { audience: 'vip', amount: 500, needs_verification: true, source_ref: 'PDF · Callosity ambiguous pricing' },
        { audience: 'non_member', amount: 700, needs_verification: true, source_ref: 'PDF · Callosity ambiguous pricing' },
      ],
    },
  ],
};

export default section;
