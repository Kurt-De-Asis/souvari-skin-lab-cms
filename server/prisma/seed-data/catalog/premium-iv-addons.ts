import { SectionDef } from '../types';

const SRC = 'SOURCE B · Doctors-Procedures.xlsx · Premium IV Add-Ons (Booster)';

function retail(price: number): { audience: 'non_member'; amount: number; source_ref: string }[] {
  return [{ audience: 'non_member', amount: price, source_ref: SRC }];
}

const section: SectionDef = {
  slug: 'premium-iv-addons',
  name: 'Premium IV Add-Ons (Booster)',
  display_order: 25,
  is_bookable: false,
  services: [
    { name: 'Vitamin C Boost (500 mg)', slug: 'ivb-vitamin-c-500', category: 'injection', duration_minutes: 10, treatment_type: 'Premium IV Add-Ons (Booster)', external_id: '24826563', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', prices: retail(500) },
    { name: 'Vitamin C Boost (10,000 mg) - High Dose Immunity', slug: 'ivb-vitamin-c-10k', category: 'injection', duration_minutes: 10, treatment_type: 'Premium IV Add-Ons (Booster)', external_id: '24826563', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', prices: retail(1799) },
    { name: 'Placenta Glow Enhancer', slug: 'ivb-placenta', category: 'injection', duration_minutes: 10, treatment_type: 'Premium IV Add-Ons (Booster)', external_id: '24826553', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', prices: retail(1499) },
    { name: 'Alpha Lipoic Acid (ALA) Detox', slug: 'ivb-ala', category: 'injection', duration_minutes: 10, treatment_type: 'Premium IV Add-Ons (Booster)', external_id: '24826551', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', prices: retail(1399) },
    { name: 'Vitamin B Complex (B1 + B2 + B12)', slug: 'ivb-vitamin-b-complex', category: 'injection', duration_minutes: 10, treatment_type: 'Premium IV Add-Ons (Booster)', description: 'Composition discrepancy flagged: SOURCE B lists B1+B2+B12; SOURCE A says B1+B6+B12.', external_id: '24826544', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', needs_verification: true, prices: retail(1299) },
    { name: 'L-Carnitine Slim Boost', slug: 'ivb-l-carnitine', category: 'injection', duration_minutes: 10, treatment_type: 'Premium IV Add-Ons (Booster)', external_id: '24826540', online_booking: 'Enabled', available_for: 'Everyone', voucher_sales: 'Enabled', commissions: 'Enabled', prices: retail(1199) },
  ],
};

export default section;