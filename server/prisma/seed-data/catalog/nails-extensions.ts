import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README 12 · NAIL EXTENSIONS AND SPECIALIZED';

const section: SectionDef = {
  slug: 'nail-extensions',
  name: 'NAIL EXTENSIONS AND SPECIALIZED',
  display_order: 12,
  services: [
    { name: 'Soft Gel Extensions with UV Gel (Full Set)', slug: 'nx-soft-gel-extensions', category: 'other', duration_minutes: 90, prices: base(1399, SRC) },
    { name: 'Soft BIAB (Full Set)', slug: 'nx-soft-biab-full-set', category: 'other', duration_minutes: 60, prices: base(799, SRC) },
    { name: 'Soft BIAB Removal (Souvari Work)', slug: 'nx-soft-biab-removal-iave', category: 'other', duration_minutes: 20, prices: base(350, SRC) },
    { name: 'Soft BIAB Removal (from another salon)', slug: 'nx-soft-biab-removal-other', category: 'other', duration_minutes: 20, prices: base(399, SRC) },
    { name: 'Dual Form (Full Set)', slug: 'nx-dual-form-full-set', category: 'other', duration_minutes: 60, prices: base(999, SRC) },
    { name: 'Dual Form Removal (Souvari Work)', slug: 'nx-dual-form-removal-iave', category: 'other', duration_minutes: 20, prices: base(350, SRC) },
    { name: 'Dual Form Removal (from another salon)', slug: 'nx-dual-form-removal-other', category: 'other', duration_minutes: 20, prices: base(399, SRC) },
    { name: 'Extension Removal (Soft Gel – Souvari Work)', slug: 'nx-extension-removal-iave', category: 'other', duration_minutes: 20, prices: base(350, SRC) },
    { name: 'Extension Removal (from another salon)', slug: 'nx-extension-removal-other', category: 'other', duration_minutes: 20, prices: base(399, SRC) },
    { name: 'Nail Extension Repair – Per Nail', slug: 'nx-extension-repair-per-nail', category: 'other', duration_minutes: 10, prices: base(299, SRC) },
  ],
};

export default section;