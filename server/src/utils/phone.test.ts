import { describe, it, expect } from 'vitest';
import { toE164, toPHNumber } from './phone';

describe('toE164', () => {
  it('normalises local formats to E.164', () => {
    expect(toE164('09171234567')).toBe('+639171234567');
    expect(toE164('0917 123 4567')).toBe('+639171234567');
    expect(toE164('(0917) 123-4567')).toBe('+639171234567');
    expect(toE164('9171234567')).toBe('+639171234567');
  });

  it('accepts a well-formed international number unchanged', () => {
    expect(toE164('+639171234567')).toBe('+639171234567');
    expect(toE164('+63 917 123 4567')).toBe('+639171234567');
    expect(toE164('00639171234567')).toBe('+639171234567');
  });

  it('never re-prefixes an already-international value', () => {
    // Regression: "+63999999999" was turned into "+636399999999", so the value
    // could never be matched against the copy already stored in the database.
    expect(toE164('+63999999999')).toBe('+63999999999');
    expect(toE164('+63917')).toBe('+63917');
    expect(toE164('+63 999 999 999')).toBe('+63999999999');
  });

  it('is idempotent, so normalising twice yields one canonical value', () => {
    for (const input of ['09171234567', '+639171234567', '00639171234567', '+63999999999']) {
      const once = toE164(input);
      expect(toE164(once)).toBe(once);
    }
  });

  it('assumes the Philippines for a bare international prefix without +63', () => {
    expect(toE164('009171234567')).toBe('+639171234567');
  });

  it('treats empty input as null', () => {
    expect(toE164(null)).toBeNull();
    expect(toE164(undefined)).toBeNull();
    expect(toE164('')).toBeNull();
    expect(toE164('   ')).toBeNull();
  });
});

describe('toPHNumber', () => {
  it('renders a Philippine mobile number in local format', () => {
    expect(toPHNumber('+639171234567')).toBe('09171234567');
    expect(toPHNumber('09171234567')).toBe('09171234567');
    expect(toPHNumber('+63 917 123 4567')).toBe('09171234567');
  });

  it('returns null for values that are not valid Philippine mobiles', () => {
    expect(toPHNumber('+63917')).toBeNull();
    expect(toPHNumber('+63 999 999 999')).toBeNull();
    expect(toPHNumber(null)).toBeNull();
  });
});
