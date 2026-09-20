import { SectionDef } from '../types';
import { nailArtPrices } from '../helpers';

const SRC = 'PDF p.29-30 · Nail Art & Effect Add-Ons';

const section: SectionDef = {
  slug: 'nail-art',
  name: 'Nail Art & Effect Add-Ons',
  display_order: 12,
  services: [
    { name: 'Matte Top Coat', slug: 'na-matte-top-coat', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(14, 19, 97, 129) },
    { name: 'Minimalist Line / Dot', slug: 'na-minimalist-line-dot', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(29, 39, 187, 249) },
    { name: 'Accent Glitter Brush', slug: 'na-accent-glitter-brush', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(37, 49, 224, 299) },
    { name: 'Classic French Gel Tip', slug: 'na-classic-french-gel-tip', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(46, 59, 262, 349) },
    { name: 'Foil / Decal Accent', slug: 'na-foil-decal-accent', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(44, 59, 262, 349) },
    { name: 'Full Glitter Nail', slug: 'na-full-glitter-nail', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(59, 79, 337, 449) },
    { name: 'Glow-in-the-Dark Gel', slug: 'na-glow-in-the-dark', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(59, 79, 337, 449) },
    { name: 'Nail Stamping Art', slug: 'na-nail-stamping-art', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(52, 69, 299, 399) },
    { name: 'Negative Space / Cut-Out', slug: 'na-negative-space-cut-out', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(52, 69, 299, 399) },
    { name: 'Blooming Gel / Watercolor', slug: 'na-blooming-gel-watercolor', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(67, 89, 374, 499) },
    { name: 'Velvet / Flocked Nails', slug: 'na-velvet-flocked', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(67, 89, 412, 549) },
    { name: 'Marble Effect', slug: 'na-marble-effect', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(67, 89, 412, 549) },
    { name: 'Cat Eye Polish Effect', slug: 'na-cat-eye-polish', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(67, 89, 397, 529) },
    { name: 'Basic Hand-Painted Art', slug: 'na-basic-hand-painted', category: 'other', duration_minutes: 20, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(59, 79, 374, 499) },
    { name: 'Chrome Mirror Effect', slug: 'na-chrome-mirror', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(67, 89, 449, 599) },
    { name: 'Blush / Aura Nails', slug: 'na-blush-aura', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(67, 89, 449, 599) },
    { name: 'Chrome Line Design', slug: 'na-chrome-line-design', category: 'other', duration_minutes: 10, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(74, 99, 449, 599) },
    { name: 'Ombre Gradient', slug: 'na-ombre-gradient', category: 'other', duration_minutes: 20, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(82, 109, 487, 649) },
    { name: 'Artistic French Gel Tip', slug: 'na-artistic-french-gel-tip', category: 'other', duration_minutes: 20, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(82, 109, 487, 649) },
    { name: '3D Lines / Embossed', slug: 'na-3d-lines-embossed', category: 'other', duration_minutes: 20, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(112, 149, 637, 849) },
    { name: 'Intricate Hand-Painted Art', slug: 'na-intricate-hand-painted', category: 'other', duration_minutes: 30, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(112, 149, 637, 849) },
    { name: 'Encapsulated Designs', slug: 'na-encapsulated-designs', category: 'other', duration_minutes: 20, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(142, 189, 824, 1099) },
    { name: '3D Sculpted Flower', slug: 'na-3d-sculpted-flower', category: 'other', duration_minutes: 30, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(97, 129, 674, 899) },
    { name: 'Custom 3D Charms / Sculpted Art', slug: 'na-custom-3d-charms', category: 'other', duration_minutes: 30, variants: [{ variant_key: 'per_nail', label: 'Per Nail' }, { variant_key: 'full_set', label: 'Full Set' }], prices: nailArtPrices(187, 249, 1199, 1599) },
  ],
};

export default section;