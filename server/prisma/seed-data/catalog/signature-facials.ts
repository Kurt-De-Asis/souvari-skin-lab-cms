import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README 1 · FACIALS';

const section: SectionDef = {
  slug: 'signature-facials',
  name: 'FACIALS',
  display_order: 1,
  services: [
    { name: 'Diamond Glow Classic', slug: 'sf-diamond-glow-classic', category: 'facial', duration_minutes: 60, prices: base(499, SRC) },
    { name: 'Signature DermaClear Facial', slug: 'sf-dermaclear-facial', category: 'facial', duration_minutes: 60, prices: base(799, SRC) },
    { name: 'Signature DermaClear+ Diamond Facial', slug: 'sf-dermaclear-diamond', category: 'facial', duration_minutes: 60, prices: base(999, SRC) },
    { name: 'Signature DermaClear+ Mask & PDT Facial', slug: 'sf-dermaclear-mask-pdt', category: 'facial', duration_minutes: 75, prices: base(1249, SRC) },
    { name: 'Signature Diamond DermaClear+ Mask & PDT Facial', slug: 'sf-diamond-mask-pdt', category: 'facial', duration_minutes: 75, prices: base(1599, SRC) },
    { name: 'Signature DermaClear+ Clinical O2 AcneClear with Anti-Aging', slug: 'sf-o2-acneclear-antiaging', category: 'facial', duration_minutes: 90, prices: base(2999, SRC) },
    { name: 'Signature Diamond DermaClear+ Clinical O2 AcneClear with Anti-Aging', slug: 'sf-diamond-o2-acneclear-antiaging', category: 'facial', duration_minutes: 105, prices: base(3499, SRC) },
    { name: '10 in 1 HydraFacial', slug: 'sf-10in1-hydrafacial', category: 'facial', duration_minutes: 60, prices: base(1299, SRC) },
    { name: 'Hollywood Carbon Laser Peel (Face)', slug: 'sf-hollywood-carbon-laser-peel', category: 'laser', duration_minutes: 45, prices: base(1499, SRC) },
    { name: 'Mild Acne Treatment w/ Mask', slug: 'sf-mild-acne-treatment', category: 'facial', duration_minutes: 60, prices: base(1249, SRC) },
    { name: 'Severe Acne Treatment + Mask', slug: 'sf-severe-acne-treatment', category: 'facial', duration_minutes: 75, prices: base(1549, SRC) },
  ],
};

export default section;