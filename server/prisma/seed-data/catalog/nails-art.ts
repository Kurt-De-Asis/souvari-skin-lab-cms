import { SectionDef } from '../types';
import { nailArtPrices } from '../helpers';

const section: SectionDef = {
  slug: 'nail-art',
  name: 'Nail Art',
  display_order: 12,
  services: [
    { name: 'Cat Eye', slug: 'cat-eye', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(25, 30, 300, 350) },
    { name: 'Velvet Cat Eye', slug: 'velvet-cat-eye', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(25, 30, 300, 350) },
    { name: 'Cat Eye French', slug: 'cat-eye-french', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(30, 35, 350, 400) },
    { name: 'Cat Eye Glazed', slug: 'cat-eye-glazed', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(30, 35, 350, 400) },
    { name: 'Plain Glazed', slug: 'plain-glazed', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(25, 30, 250, 300) },
    { name: 'Chrome Glazed', slug: 'chrome-glazed', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(30, 35, 350, 400) },
    { name: 'Colorful Glazed', slug: 'colorful-glazed', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(30, 35, 350, 400) },
    { name: 'French Glazed', slug: 'french-glazed', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(30, 35, 350, 400) },
    { name: 'Encapsulated', slug: 'encapsulated', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(45, 50, 500, 550) },
    { name: 'Ombre', slug: 'ombre', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(25, 30, 300, 350) },
    { name: 'Colorful Ombre', slug: 'colorful-ombre', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(30, 35, 350, 400) },
    { name: 'Colorful French', slug: 'colorful-french', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(30, 35, 350, 400) },
    { name: '3D French', slug: '3d-french', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(45, 50, 500, 550) },
    { name: '3D Ombre', slug: '3d-ombre', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(45, 50, 500, 550) },
    { name: 'Freestyle', slug: 'freestyle', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(45, 50, 500, 550) },
    { name: 'Velvet Base', slug: 'velvet-base', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(35, 40, 400, 450) },
    { name: 'Poly Art', slug: 'poly-art', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(45, 50, 500, 550) },
    { name: 'Glitter', slug: 'glitter', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(25, 30, 300, 350) },
    { name: '3D Bow', slug: '3d-bow', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(45, 50, 500, 550) },
    { name: '3D Flower', slug: '3d-flower', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(45, 50, 500, 550) },
    { name: 'Hand Painted', slug: 'hand-painted', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(35, 40, 400, 450) },
    { name: 'Chrome', slug: 'chrome', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(30, 35, 350, 400) },
    { name: '3D Chrome', slug: '3d-chrome', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(45, 50, 500, 550) },
    { name: 'Crystal', slug: 'crystal', category: 'other', duration_minutes: 0, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(35, 40, 400, 450) },
  ],
};

export default section;
