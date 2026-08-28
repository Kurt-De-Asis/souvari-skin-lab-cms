import { SectionDef } from '../types';
import { nailArtPrices } from '../helpers';

const section: SectionDef = {
  slug: 'nail-crystals',
  name: 'Nail Crystals',
  display_order: 13,
  services: [
    {
      name: 'Small Crystal',
      slug: 'small-crystal',
      category: 'other',
      duration_minutes: 10,
      variants: [
        { variant_key: 'per_piece', label: 'Per Piece' },
        { variant_key: 'full_set', label: 'Full Set' },
      ],
      prices: nailArtPrices(10, 15, 120, 180),
    },
    {
      name: 'Medium Crystal',
      slug: 'medium-crystal',
      category: 'other',
      duration_minutes: 10,
      variants: [
        { variant_key: 'per_piece', label: 'Per Piece' },
        { variant_key: 'full_set', label: 'Full Set' },
      ],
      prices: nailArtPrices(15, 20, 180, 240),
    },
    {
      name: 'Big Crystal',
      slug: 'big-crystal',
      category: 'other',
      duration_minutes: 10,
      variants: [
        { variant_key: 'per_piece', label: 'Per Piece' },
        { variant_key: 'full_set', label: 'Full Set' },
      ],
      prices: nailArtPrices(20, 25, 240, 300),
    },
  ],
};

export default section;
