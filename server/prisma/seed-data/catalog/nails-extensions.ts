import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.27-28 · Nail Extensions & Specialized Care';

const section: SectionDef = {
  slug: 'nail-extensions',
  name: 'Nail Extensions & Specialized Care',
  display_order: 11,
  services: [
    { name: 'Soft Gel Extensions with UV Gel (Full Set)', slug: 'nx-soft-gel-extensions', category: 'other', duration_minutes: 90, prices: vipNm(1049, 1399, { source_ref: SRC }) },
    { name: 'Soft BIAB (Full Set)', slug: 'nx-soft-biab-full-set', category: 'other', duration_minutes: 60, prices: vipNm(599.25, 799, { source_ref: SRC }) },
    { name: 'Soft BIAB Removal (IAVE Work)', slug: 'nx-soft-biab-removal-iave', category: 'other', duration_minutes: 20, prices: vipNm(263, 350, { source_ref: SRC }) },
    { name: 'Soft BIAB Removal (from another salon)', slug: 'nx-soft-biab-removal-other', category: 'other', duration_minutes: 20, prices: vipNm(299.25, 399, { source_ref: SRC }) },
    { name: 'Dual Form (Full Set)', slug: 'nx-dual-form-full-set', category: 'other', duration_minutes: 60, prices: vipNm(749.25, 999, { source_ref: SRC }) },
    { name: 'Dual Form Removal (IAVE Work)', slug: 'nx-dual-form-removal-iave', category: 'other', duration_minutes: 20, prices: vipNm(263, 350, { source_ref: SRC }) },
    { name: 'Dual Form Removal (from another salon)', slug: 'nx-dual-form-removal-other', category: 'other', duration_minutes: 20, prices: vipNm(299.25, 399, { source_ref: SRC }) },
    { name: 'Extension Removal (Soft Gel – IAVE Work)', slug: 'nx-extension-removal-iave', category: 'other', duration_minutes: 20, prices: vipNm(263, 350, { source_ref: SRC }) },
    { name: 'Extension Removal (from another salon)', slug: 'nx-extension-removal-other', category: 'other', duration_minutes: 20, prices: vipNm(299, 399, { source_ref: SRC }) },
    { name: 'Nail Extension Repair – Per Nail', slug: 'nx-extension-repair-per-nail', category: 'other', duration_minutes: 10, prices: vipNm(224, 299, { source_ref: SRC }) },
  ],
};

export default section;