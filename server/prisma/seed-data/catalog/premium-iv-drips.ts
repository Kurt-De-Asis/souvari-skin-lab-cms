import { SectionDef } from '../types';

const SRC_B = 'SOURCE B · Doctors-Procedures.xlsx · Premium IV Drips';

function retail(price: number): { audience: 'non_member'; amount: number; source_ref: string }[] {
  return [{ audience: 'non_member', amount: price, source_ref: SRC_B }];
}

const section: SectionDef = {
  slug: 'premium-iv-drips',
  name: 'Premium IV Drips',
  description: 'Lumiere IV drip infusions. Single-session and multi-session packs imported from SOURCE B. NOTE: Radiance single-session ₱3,669 (SOURCE B) differs from ₱3,699 (SOURCE A page 53). Flagged for reconciliation.',
  display_order: 24,
  is_bookable: false,
  services: [
    { name: 'Lumiere Pure', slug: 'iv-lumiere-pure', category: 'injection', duration_minutes: 60, treatment_type: 'Premium IV Drips', external_id: '24825778', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', needs_verification: false, prices: retail(2499) },
    { name: 'Lumiere Pure - 5 Sessions', slug: 'iv-lumiere-pure-5s', category: 'injection', duration_minutes: 60, treatment_type: 'Premium IV Drips', external_id: '24825778', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', needs_verification: false, prices: retail(11995) },
    { name: 'Lumiere Pure - 10 Sessions', slug: 'iv-lumiere-pure-10s', category: 'injection', duration_minutes: 60, treatment_type: 'Premium IV Drips', external_id: '24825778', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', needs_verification: false, prices: retail(22990) },
    { name: 'Lumiere Radiance', slug: 'iv-lumiere-radiance', category: 'injection', duration_minutes: 60, treatment_type: 'Premium IV Drips', external_id: '24825765', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', needs_verification: true, description: 'Price discrepancy flagged: SOURCE B xlsx lists ₱3,669; SOURCE A page 53 lists ₱3,699. ₱3,669 used per SOURCE B.', prices: retail(3669) },
    { name: 'Lumiere Radiance - 5 Sessions', slug: 'iv-lumiere-radiance-5s', category: 'injection', duration_minutes: 60, treatment_type: 'Premium IV Drips', external_id: '24825765', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', needs_verification: false, prices: retail(17995) },
    { name: 'Lumiere Radiance - 10 Sessions', slug: 'iv-lumiere-radiance-10s', category: 'injection', duration_minutes: 60, treatment_type: 'Premium IV Drips', external_id: '24825765', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', needs_verification: false, prices: retail(35000) },
    { name: 'Lumiere Crystal (2000 mg)', slug: 'iv-lumiere-crystal', category: 'injection', duration_minutes: 60, treatment_type: 'Premium IV Drips', external_id: '24825744', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', needs_verification: false, prices: retail(4699) },
    { name: 'Lumiere Crystal (2000 mg) - 5 Sessions', slug: 'iv-lumiere-crystal-5s', category: 'injection', duration_minutes: 60, treatment_type: 'Premium IV Drips', external_id: '24825744', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', needs_verification: false, prices: retail(22995) },
    { name: 'Lumiere Crystal (2000 mg) - 10 Sessions', slug: 'iv-lumiere-crystal-10s', category: 'injection', duration_minutes: 60, treatment_type: 'Premium IV Drips', external_id: '24825744', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', needs_verification: false, prices: retail(45000) },
    { name: 'Lumiere Royale (2500 mg)', slug: 'iv-lumiere-royale', category: 'injection', duration_minutes: 60, treatment_type: 'Premium IV Drips', external_id: '24825720', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', needs_verification: false, prices: retail(6000) },
    { name: 'Lumiere Royale (2500 mg) - 5 Sessions', slug: 'iv-lumiere-royale-5s', category: 'injection', duration_minutes: 60, treatment_type: 'Premium IV Drips', external_id: '24825720', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', needs_verification: false, prices: retail(29495) },
    { name: 'Lumiere Royale (2500 mg) - 10 Sessions', slug: 'iv-lumiere-royale-10s', category: 'injection', duration_minutes: 60, treatment_type: 'Premium IV Drips', external_id: '24825720', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', needs_verification: false, prices: retail(57990) },
  ],
};

export default section;