import { describe, it, expect } from 'vitest';
import { lashTiers, waxVipNm4, vipNmRegular, vipNm, nailArtPrices } from './helpers';

describe('lashTiers', () => {
  it('builds vip/nm × senior/guru matrix, omitting unavailable guru tiers', () => {
    const rows = lashTiers(1200, 1500, 1500, 1900);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual({ audience: 'vip', staff_tier: 'senior', amount: 1200 });
    expect(rows[1]).toEqual({ audience: 'non_member', staff_tier: 'senior', amount: 1500 });
    expect(rows[2]).toEqual({ audience: 'vip', staff_tier: 'guru', amount: 1500 });
    expect(rows[3]).toEqual({ audience: 'non_member', staff_tier: 'guru', amount: 1900 });
  });

  it('omits null guru rows (staff not qualified)', () => {
    const rows = lashTiers(1200, null, 1500, null);
    expect(rows).toHaveLength(2);
    expect(rows.every(r => r.staff_tier === 'senior')).toBe(true);
  });

  it('threads source_ref through rows', () => {
    const rows = lashTiers(1200, 1500, 1500, 1900, { source_ref: 'PDF p.30' });
    expect(rows.every(r => r.source_ref === 'PDF p.30')).toBe(true);
  });
});

describe('waxVipNm4', () => {
  it('builds 4 gender-scoped rows (vip/nm × female/male)', () => {
    const rows = waxVipNm4(287, 351, 359, 439);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual({ audience: 'vip', gender_scope: 'female', amount: 287 });
    expect(rows[1]).toEqual({ audience: 'non_member', gender_scope: 'female', amount: 359 });
    expect(rows[2]).toEqual({ audience: 'vip', gender_scope: 'male', amount: 351 });
    expect(rows[3]).toEqual({ audience: 'non_member', gender_scope: 'male', amount: 439 });
  });

  it('marks male as unavailable when null', () => {
    const rows = waxVipNm4(899, null, 999, null);
    expect(rows).toHaveLength(4);
    const maleRows = rows.filter(r => r.gender_scope === 'male');
    expect(maleRows).toHaveLength(2);
    expect(maleRows.every(r => r.amount === 0 && r.is_available === false)).toBe(true);
  });
});

describe('vipNm / vipNmRegular', () => {
  it('returns vip and non_member rows', () => {
    expect(vipNm(374, 499)).toHaveLength(2);
    expect(vipNm(374, 499)[0]).toEqual({ audience: 'vip', amount: 374 });
  });

  it('returns vip, non_member, and regular rows preserving order', () => {
    const rows = vipNmRegular(795, 995, 995);
    expect(rows.map(r => r.audience)).toEqual(['vip', 'non_member', 'regular']);
  });
});

describe('nailArtPrices', () => {
  it('builds per_nail and full_set variant rows', () => {
    const rows = nailArtPrices(79, 99, 379, 499);
    expect(rows).toHaveLength(4);
    expect(rows[0]).toEqual({ audience: 'vip', variant_key: 'per_nail', amount: 79 });
    expect(rows[2]).toEqual({ audience: 'vip', variant_key: 'full_set', amount: 379 });
  });
});