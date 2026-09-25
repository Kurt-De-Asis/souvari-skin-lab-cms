import { SectionDef } from '../types';
import { base } from '../helpers';

const SRC = 'README §17 · HOT WAX HAIR REMOVAL';

const section: SectionDef = {
  slug: 'hot-wax',
  name: 'HOT WAX HAIR REMOVAL',
  display_order: 17,
  services: [
    { name: 'Underarm', slug: 'hx-underarm', category: 'body', duration_minutes: 20, prices: base(439, SRC) },
    { name: 'Brazilian', slug: 'hx-brazilian', category: 'body', duration_minutes: 45, prices: base(1119, SRC) },
    { name: 'Full Face (Brow, Lip, Chin, Neck)', slug: 'hx-full-face', category: 'body', duration_minutes: 30, prices: base(999, SRC) },
    { name: 'Full Back', slug: 'hx-full-back', category: 'body', duration_minutes: 45, prices: base(1125, SRC) },
    { name: 'Full Leg', slug: 'hx-full-leg', category: 'body', duration_minutes: 60, prices: base(969, SRC) },
    { name: 'Back (Upper/Lower)', slug: 'hx-back-upper-lower', category: 'body', duration_minutes: 30, prices: base(929, SRC) },
    { name: 'Bikini', slug: 'hx-bikini', category: 'body', duration_minutes: 30, prices: base(789, SRC) },
    { name: 'Buttocks', slug: 'hx-buttocks', category: 'body', duration_minutes: 30, prices: base(719, SRC) },
    { name: 'Half Leg', slug: 'hx-half-leg', category: 'body', duration_minutes: 45, prices: base(749, SRC) },
    { name: 'Full Arm', slug: 'hx-full-arm', category: 'body', duration_minutes: 45, prices: base(949, SRC) },
    { name: 'Tummy / Stomach', slug: 'hx-tummy-stomach', category: 'body', duration_minutes: 30, prices: base(599, SRC) },
    { name: 'Half Arm', slug: 'hx-half-arm', category: 'body', duration_minutes: 30, prices: base(679, SRC) },
    { name: 'Chest', slug: 'hx-chest', category: 'body', duration_minutes: 30, prices: base(699, SRC) },
    { name: 'Shoulders', slug: 'hx-shoulders', category: 'body', duration_minutes: 20, prices: base(679, SRC) },
    { name: 'Neck', slug: 'hx-neck', category: 'body', duration_minutes: 15, prices: base(479, SRC) },
    { name: 'Lip (Upper & Lower)', slug: 'hx-lip', category: 'body', duration_minutes: 10, prices: base(210, SRC) },
    { name: 'Chin Waxing', slug: 'hx-chin', category: 'body', duration_minutes: 10, prices: base(249, SRC) },
    { name: 'Eyebrow Design', slug: 'hx-eyebrow', category: 'body', duration_minutes: 10, prices: base(369, SRC) },
    { name: 'Hands / Fingers', slug: 'hx-hands', category: 'body', duration_minutes: 15, prices: base(249, SRC) },
    { name: 'Feet / Toes', slug: 'hx-feet', category: 'body', duration_minutes: 15, prices: base(309, SRC) },
  ],
};

export default section;