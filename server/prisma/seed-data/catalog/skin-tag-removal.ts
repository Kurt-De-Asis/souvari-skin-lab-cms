import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.19-20 · Skin Tag / Wart Removal (VIP & Non-VIP price lists)';

type Prices = [number, number]; // [vip, non_member]
type SizeRow =
  | { size: string; classic: Prices; co2: Prices }
  | { size: string; classic: Prices; co2Only: boolean };

type Treatment = { name: string; slug: string; rows: SizeRow[] };

const treatments: Treatment[] = [
  {
    name: 'Flat Warts',
    slug: 'flat-warts',
    rows: [{ size: 'Unlimited (one body part per area)', classic: [1499, 1999], co2: [2250, 2999] }],
  },
  {
    name: 'Filiform Warts',
    slug: 'filiform-warts',
    rows: [
      { size: 'Small (under 2mm)', classic: [900, 1200], co2: [1350, 1799] },
      { size: 'Medium (2-4mm)', classic: [1425, 1900], co2: [2175, 2899] },
      { size: 'Large (over 4mm)', classic: [1725, 2300], co2: [2625, 3499] },
    ],
  },
  {
    name: 'Common Warts',
    slug: 'common-warts',
    rows: [
      { size: 'Small (under 2mm)', classic: [900, 1200], co2: [1350, 1799] },
      { size: 'Medium (2-4mm)', classic: [1425, 1900], co2: [2175, 2899] },
      { size: 'Large (over 4mm)', classic: [1725, 2300], co2: [2625, 3499] },
    ],
  },
  {
    name: 'Skin Tags',
    slug: 'skin-tags',
    rows: [
      { size: 'Small (under 2mm)', classic: [375, 500], co2: [375, 500] },
      { size: 'Medium (2-4mm)', classic: [900, 1200], co2: [900, 1200] },
      { size: 'Large (over 4mm)', classic: [1650, 2200], co2: [1650, 2200] },
      { size: 'Unlimited (one area)', classic: [2399, 3199], co2: [2399, 3199] },
    ],
  },
  {
    name: 'Millia',
    slug: 'millia',
    rows: [
      { size: 'Small (under 2mm)', classic: [450, 600], co2: [450, 600] },
      { size: 'Medium (2-4mm)', classic: [975, 1300], co2: [975, 1300] },
      { size: 'Large (over 4mm)', classic: [1575, 2100], co2: [1575, 2100] },
      { size: 'Unlimited (one area)', classic: [1499, 1999], co2: [1499, 1999] },
    ],
  },
  {
    name: 'Syringoma',
    slug: 'syringoma',
    rows: [
      { size: 'Small (under 2mm)', classic: [450, 600], co2Only: true },
      { size: 'Medium (2-4mm)', classic: [975, 1300], co2Only: true },
      { size: 'Large (over 4mm)', classic: [1575, 2100], co2Only: true },
      { size: 'Unlimited (per eye area)', classic: [2399, 3199], co2Only: true },
      { size: 'CO2 Unlimited (per eye area)', classic: [3600, 4799], co2Only: true },
    ],
  },
];

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const section: SectionDef = {
  slug: 'skin-tag-removal',
  name: 'Skin Tag / Wart Removal',
  display_order: 8,
  services: treatments.flatMap((t) =>
    t.rows.flatMap((row) => {
      const entries: Array<{ method: string; price: Prices }> = 'co2Only' in row && row.co2Only
        ? [{ method: 'Precision CO2', price: row.classic }]
        : [
            { method: 'Classic', price: row.classic },
            { method: 'Precision CO2', price: (row as { co2: Prices }).co2 },
          ];
      return entries.map((m) => ({
        name: `${t.name} – ${m.method} (${row.size})`,
        slug: `st-${t.slug}-${m.method === 'Precision CO2' ? 'co2' : 'classic'}-${slugify(row.size)}`,
        category: 'skin_rejuvenation' as const,
        duration_minutes: 15,
        needs_verification: true,
        description: `Skin Tag / Wart Removal – ${t.name} (${row.size}). Method: ${m.method}. VIP Member / Non-Member pricing.`,
        prices: vipNm(m.price[0], m.price[1], { source_ref: SRC, needs_verification: true }),
      }));
    }),
  ),
};

export default section;