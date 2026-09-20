import { PriceRowInput } from './types';

export function makeSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function peso(amount: number): string {
  return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

export function vipNm(vip: number, nm: number, opts?: Partial<PriceRowInput>): PriceRowInput[] {
  return [
    { audience: 'vip', amount: vip, ...opts },
    { audience: 'non_member', amount: nm, ...opts },
  ];
}

export function vipNmRegular(vip: number, nm: number, regular: number, opts?: Partial<PriceRowInput>): PriceRowInput[] {
  return [
    { audience: 'vip', amount: vip, ...opts },
    { audience: 'non_member', amount: nm, ...opts },
    { audience: 'regular', amount: regular, ...opts },
  ];
}

export function waxRow(vip: number, femaleNm: number | null, maleNm: number | null): PriceRowInput[] {
  const rows: PriceRowInput[] = [
    { audience: 'vip', amount: vip, gender_scope: 'any' },
  ];
  if (femaleNm !== null) {
    rows.push({ audience: 'non_member', amount: femaleNm, gender_scope: 'female' });
  }
  if (maleNm !== null) {
    rows.push({ audience: 'non_member', amount: maleNm, gender_scope: 'male' });
  } else {
    rows.push({ audience: 'non_member', amount: 0, gender_scope: 'male', is_available: false });
  }
  return rows;
}

export function lashTiers(vipSenior: number, vipGuru: number | null, nmSenior: number, nmGuru: number | null, opts?: Partial<PriceRowInput>): PriceRowInput[] {
  const rows: PriceRowInput[] = [
    { audience: 'vip', staff_tier: 'senior', amount: vipSenior, ...opts },
    { audience: 'non_member', staff_tier: 'senior', amount: nmSenior, ...opts },
  ];
  if (vipGuru !== null) rows.push({ audience: 'vip', staff_tier: 'guru', amount: vipGuru, ...opts });
  if (nmGuru !== null) rows.push({ audience: 'non_member', staff_tier: 'guru', amount: nmGuru, ...opts });
  return rows;
}

export function waxVipNm4(vipFemale: number, vipMale: number | null, nmFemale: number, nmMale: number | null): PriceRowInput[] {
  const rows: PriceRowInput[] = [
    { audience: 'vip', gender_scope: 'female', amount: vipFemale },
    { audience: 'non_member', gender_scope: 'female', amount: nmFemale },
  ];
  if (vipMale !== null) {
    rows.push({ audience: 'vip', gender_scope: 'male', amount: vipMale });
  } else {
    rows.push({ audience: 'vip', gender_scope: 'male', amount: 0, is_available: false });
  }
  if (nmMale !== null) {
    rows.push({ audience: 'non_member', gender_scope: 'male', amount: nmMale });
  } else {
    rows.push({ audience: 'non_member', gender_scope: 'male', amount: 0, is_available: false });
  }
  return rows;
}

export function staffTiers(technician: number, senior: number, guru: number, opts?: Partial<PriceRowInput>): PriceRowInput[] {
  return [
    { audience: 'regular', staff_tier: 'technician', amount: technician, ...opts },
    { audience: 'regular', staff_tier: 'senior', amount: senior, ...opts },
    { audience: 'regular', staff_tier: 'guru', amount: guru, ...opts },
  ];
}

export function vipNmStaff(vip: number, nm: number, opts?: Partial<PriceRowInput>): PriceRowInput[] {
  return [
    { audience: 'vip', amount: vip, ...opts },
    { audience: 'non_member', amount: nm, ...opts },
  ];
}

export function nailArtPrices(perNailVip: number, perNailNm: number, fullSetVip: number, fullSetNm: number): PriceRowInput[] {
  return [
    { audience: 'vip', variant_key: 'per_nail', amount: perNailVip },
    { audience: 'non_member', variant_key: 'per_nail', amount: perNailNm },
    { audience: 'vip', variant_key: 'full_set', amount: fullSetVip },
    { audience: 'non_member', variant_key: 'full_set', amount: fullSetNm },
  ];
}

export function crystalPrices(smallVip: number, smallNm: number, medVip: number, medNm: number, bigVip: number, bigNm: number): PriceRowInput[] {
  return [
    { audience: 'vip', variant_key: 'per_piece', amount: smallVip },
    { audience: 'non_member', variant_key: 'per_piece', amount: smallNm },
    { audience: 'vip', variant_key: 'full_set', amount: medVip },
    { audience: 'non_member', variant_key: 'full_set', amount: medNm },
  ];
}
