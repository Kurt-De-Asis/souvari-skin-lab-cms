import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { toE164 } from './phone';

/**
 * Email and phone are the two fields shared by every role — customers, staff
 * and admins all live in the single `users` table. Both helpers below therefore
 * enforce uniqueness across the *whole* table rather than per role, which is
 * what stops a customer from claiming an address that already belongs to a
 * staff login.
 *
 * Soft-deleted rows are deliberately included: the unique indexes cover them
 * too, so letting a new account reuse a deleted user's email or phone would
 * pass the service check and then fail at the database with an opaque error.
 */

/** Trim and lowercase so "  Juan@GMail.com " and "juan@gmail.com" collide. */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (email === null || email === undefined) return null;
  const trimmed = String(email).trim().toLowerCase();
  return trimmed.length ? trimmed : null;
}

/**
 * Canonicalise to E.164 so "+63 917 123 4567", "0917 123 4567" and
 * "09171234567" are recognised as the same number. Empty input becomes null,
 * which the unique index tolerates for any number of rows.
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (phone === null || phone === undefined) return null;
  if (!String(phone).trim()) return null;
  return toE164(String(phone));
}

export async function assertEmailAvailable(
  email: string | null | undefined,
  excludeUserId?: number,
): Promise<string | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const existing = await prisma.users.findFirst({
    where: {
      email: normalized,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
    select: { id: true, role: true },
  });

  if (!existing) return normalized;

  if (existing.role === 'admin' || existing.role === 'staff') {
    throw new AppError('This email is already in use by a staff account', 409);
  }
  throw new AppError('Email already registered', 409);
}

export async function assertPhoneAvailable(
  phone: string | null | undefined,
  excludeUserId?: number,
): Promise<string | null> {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;

  const existing = await prisma.users.findFirst({
    where: {
      phone: normalized,
      ...(excludeUserId ? { NOT: { id: excludeUserId } } : {}),
    },
    select: { id: true, role: true },
  });

  if (!existing) return normalized;

  if (existing.role === 'admin' || existing.role === 'staff') {
    throw new AppError('This phone number is already in use by a staff account', 409);
  }
  throw new AppError('Phone number is already registered', 409);
}

/**
 * Validates and normalises both fields in one pass. Callers get back the values
 * to persist, or a 409 naming whichever field collided.
 */
export async function resolveIdentityFields(input: {
  email?: string | null;
  phone?: string | null;
}, excludeUserId?: number): Promise<{ email?: string | null; phone?: string | null }> {
  const result: { email?: string | null; phone?: string | null } = {};
  if (input.email !== undefined) {
    result.email = await assertEmailAvailable(input.email, excludeUserId);
  }
  if (input.phone !== undefined) {
    result.phone = await assertPhoneAvailable(input.phone, excludeUserId);
  }
  return result;
}
