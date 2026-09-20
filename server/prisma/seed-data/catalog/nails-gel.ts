import { SectionDef } from '../types';
import { vipNm } from '../helpers';

const SRC = 'PDF p.26-27 · Gel Polish Premier';

const section: SectionDef = {
  slug: 'nail-gel',
  name: 'Gel Polish Premier',
  display_order: 10,
  services: [
    { name: 'Luxe UV Gel Manicure', slug: 'ng-luxe-uv-gel-manicure', category: 'other', duration_minutes: 60, prices: vipNm(374, 499, { source_ref: SRC }) },
    { name: 'Luxe UV Gel Pedicure', slug: 'ng-luxe-uv-gel-pedicure', category: 'other', duration_minutes: 70, prices: vipNm(413, 550, { source_ref: SRC }) },
    { name: 'Gel Polish Removal (Other Salon)', slug: 'ng-gel-removal-other', category: 'other', duration_minutes: 15, prices: vipNm(112, 149, { source_ref: SRC }) },
    { name: 'Gel Polish Removal (IAVE Work, with New Gel Service)', slug: 'ng-gel-removal-iave', category: 'other', duration_minutes: 15, prices: vipNm(74, 99, { source_ref: SRC }) },
  ],
};

export default section;