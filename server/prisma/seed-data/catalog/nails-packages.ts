import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.31-32 · Nail Services Packages';

const section: SectionDef = {
  slug: 'nail-packages',
  name: 'Nail Services Packages',
  display_order: 14,
  services: [
    {
      name: 'Essential Set',
      slug: 'np-essential-set',
      category: 'package',
      duration_minutes: 60,
      inclusions: ['Signature Manicure (No Polish)', 'Signature Pedicure (No Polish)', 'Essential Foot Spa'],
      prices: vipNm(468, 627, { source_ref: SRC }),
    },
    {
      name: 'Gel Duo',
      slug: 'np-gel-duo',
      category: 'package',
      duration_minutes: 90,
      inclusions: ['Luxe UV Gel Manicure', 'Luxe UV Gel Pedicure', 'Essential Foot Spa'],
      prices: vipNm(1048, 1398, { source_ref: SRC }),
    },
    {
      name: 'Gel Basic',
      slug: 'np-gel-basic',
      category: 'package',
      duration_minutes: 90,
      inclusions: ['Luxe UV Gel Manicure', 'Signature Pedicure (No Polish)', 'Essential Foot Spa'],
      prices: vipNm(738, 997, { source_ref: SRC }),
    },
    {
      name: 'Hand Ritual',
      slug: 'np-hand-ritual',
      category: 'package',
      duration_minutes: 75,
      inclusions: ['Essential Hand Spa', 'Luxe UV Gel Manicure', 'Signature Pedicure (No Polish)'],
      prices: vipNm(668, 897, { source_ref: SRC }),
    },
    {
      name: 'Extension Spa',
      slug: 'np-extension-spa',
      category: 'package',
      duration_minutes: 120,
      inclusions: ['Essential Hand Spa', 'Signature Pedicure (No Polish)', 'Soft Gel Extensions with UV Gel (Full Set)', 'Essential Foot Spa'],
      prices: vipNm(1598, 2146, { source_ref: SRC }),
    },
    {
      name: 'Extension Glam',
      slug: 'np-extension-glam',
      category: 'package',
      duration_minutes: 120,
      inclusions: ['Soft Gel Extensions with UV Gel (Full Set)', 'Luxe UV Gel Pedicure', 'Deluxe Foot Spa'],
      prices: vipNm(1888, 2548, { source_ref: SRC }),
    },
    {
      name: 'Spa Retreat',
      slug: 'np-spa-retreat',
      category: 'package',
      duration_minutes: 90,
      inclusions: ['Deluxe Foot Spa', 'Essential Hand Spa', 'Signature Manicure (No Polish)', 'Signature Pedicure (No Polish)'],
      prices: vipNm(838, 1126, { source_ref: SRC }),
    },
    {
      name: 'Deluxe Torch',
      slug: 'np-deluxe-torch',
      category: 'package',
      duration_minutes: 105,
      inclusions: ['Deluxe Hand Spa', 'Luxe UV Gel Manicure', 'Signature Pedicure (No Polish)', 'Essential Foot Spa'],
      prices: vipNm(1038, 1396, { source_ref: SRC }),
    },
    {
      name: 'Ultimate Luxe',
      slug: 'np-ultimate-luxe',
      category: 'package',
      duration_minutes: 120,
      inclusions: ['Luxe UV Gel Manicure', 'Ultimate Luxe Hand Spa', 'Ultimate Luxe Foot Spa', 'Signature Pedicure (No Polish)'],
      prices: vipNm(1528, 2046, { source_ref: SRC }),
    },
  ],
};

export default section;