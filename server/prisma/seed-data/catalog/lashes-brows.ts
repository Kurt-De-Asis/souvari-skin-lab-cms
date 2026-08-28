import { SectionDef } from '../types';
import { staffTiers, vipNm } from '../helpers';

const section: SectionDef = {
  slug: 'lashes-brows',
  name: 'Lashes & Brows',
  display_order: 18,
  services: [
    {
      name: 'Classic Lash Extension',
      slug: 'classic-lash-extension',
      category: 'other',
      duration_minutes: 120,
      prices: staffTiers(900, 1100, 1500, { source_ref: 'lashes-brows#classic-lash-extension' }),
    },
    {
      name: 'Volume Lash Extension',
      slug: 'volume-lash-extension',
      category: 'other',
      duration_minutes: 120,
      prices: staffTiers(1200, 1500, 2000, { source_ref: 'lashes-brows#volume-lash-extension' }),
    },
    {
      name: 'Hybrid Lash Extension',
      slug: 'hybrid-lash-extension',
      category: 'other',
      duration_minutes: 120,
      prices: staffTiers(1200, 1500, 2000, { source_ref: 'lashes-brows#hybrid-lash-extension' }),
    },
    {
      name: 'Classic Fill-Up',
      slug: 'classic-fill-up',
      category: 'other',
      duration_minutes: 60,
      prices: staffTiers(500, 600, 800, { source_ref: 'lashes-brows#classic-fill-up' }),
    },
    {
      name: 'Volume Fill-Up',
      slug: 'volume-fill-up',
      category: 'other',
      duration_minutes: 60,
      prices: staffTiers(700, 800, 1000, { source_ref: 'lashes-brows#volume-fill-up' }),
    },
    {
      name: 'Hybrid Fill-Up',
      slug: 'hybrid-fill-up',
      category: 'other',
      duration_minutes: 60,
      prices: staffTiers(700, 800, 1000, { source_ref: 'lashes-brows#hybrid-fill-up' }),
    },
    {
      name: 'Lash Lift',
      slug: 'lash-lift',
      category: 'other',
      duration_minutes: 60,
      prices: staffTiers(800, 1000, 1300, { source_ref: 'lashes-brows#lash-lift' }),
    },
    {
      name: 'Lash Tint',
      slug: 'lash-tint',
      category: 'other',
      duration_minutes: 30,
      prices: staffTiers(300, 350, 450, { source_ref: 'lashes-brows#lash-tint' }),
    },
  ],
};

export default section;
