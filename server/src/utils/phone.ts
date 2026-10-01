export function toE164(phone: string | null | undefined): string | null {
  if (!phone) return null;

  let cleaned = phone.replace(/[\s\-().]/g, '').trim();
  if (!cleaned) return null;

  // Input that already declares itself international is authoritative: "+63..." or
  // "0063...". Prefixing 63 onto those again would corrupt a stored number and make
  // it impossible to match against the value already in the database.
  let isInternational = false;

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.slice(1);
    isInternational = true;
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.slice(2);
    isInternational = true;
  }

  if (isInternational) return cleaned.startsWith('63') ? `+${cleaned}` : `+63${cleaned}`;

  // Bare local input still needs the country code inferred.
  if (cleaned.startsWith('63')) {
    cleaned = cleaned.length === 12 ? cleaned : `63${cleaned}`;
    return `+${cleaned}`;
  }

  if (cleaned.startsWith('0')) return `+63${cleaned.slice(1)}`;

  if (cleaned.length === 10 && cleaned.startsWith('9')) return `+63${cleaned}`;

  return `+${cleaned}`;
}

export function toPHNumber(phone: string | null | undefined): string | null {
  const e164 = toE164(phone);
  if (!e164 || !e164.startsWith('+63')) return null;

  const digits = e164.slice(1);
  const local = digits.startsWith('63') ? digits.slice(2) : digits;

  if (!local.startsWith('9') || local.length !== 10) return null;

  return `0${local}`;
}