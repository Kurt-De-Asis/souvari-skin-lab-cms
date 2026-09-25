import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README §11 · GEL POLISH PREMIER';

const section: SectionDef = {
  slug: 'nail-gel',
  name: 'GEL POLISH PREMIER',
  display_order: 11,
  services: [
    { name: 'Luxe UV Gel Manicure', slug: 'ng-luxe-uv-gel-manicure', category: 'other', duration_minutes: 60, prices: base(499, SRC) },
    { name: 'Luxe UV Gel Pedicure', slug: 'ng-luxe-uv-gel-pedicure', category: 'other', duration_minutes: 70, prices: base(550, SRC) },
    { name: 'Gel Polish Removal (Other salon)', slug: 'ng-gel-removal-other', category: 'other', duration_minutes: 15, prices: base(149, SRC) },
    { name: 'Gel Polish Removal (Souvari Work, with new Gel Service)', slug: 'ng-gel-removal-iave', category: 'other', duration_minutes: 15, prices: base(99, SRC) },
  ],
};

export default section;