import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { UpdateSettingsInput } from './settings.validation';
import { WEEKDAY_NAMES } from '../appointments/appointments.validation';

const PUBLIC_KEYS = [
  'clinic_name',
  'clinic_phone',
  'clinic_email',
  'clinic_address',
  'business_days',
  'business_hours_start',
  'business_hours_end',
];

const WEEKDAY_SET = new Set<string>(WEEKDAY_NAMES);

/** The clinic must be open at least one day, and only on real weekdays. */
function assertValidBusinessDays(value: unknown): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw new AppError('Select at least one day the clinic is open', 400);
  }
  const invalid = value.filter((d) => typeof d !== 'string' || !WEEKDAY_SET.has(d.toLowerCase()));
  if (invalid.length > 0) {
    throw new AppError(`Invalid day(s): ${invalid.join(', ')}`, 400);
  }
}

class SettingsService {
  async getAll() {
    const settings = await prisma.system_settings.findMany({
      orderBy: { setting_key: 'asc' },
    });

    return settings.map((s) => ({
      key: s.setting_key,
      value: JSON.parse(s.setting_value),
      description: s.description,
      updated_at: s.updated_at,
    }));
  }

  async getPublic() {
    const settings = await prisma.system_settings.findMany({
      where: { setting_key: { in: PUBLIC_KEYS } },
    });

    const result: Record<string, any> = {};
    for (const s of settings) {
      result[s.setting_key] = JSON.parse(s.setting_value);
    }

    return result;
  }

  async update(data: UpdateSettingsInput) {
    const updates = await Promise.all(
      data.settings.map(async (item) => {
        if (item.key === 'business_days') {
          assertValidBusinessDays(item.value);
        }

        const existing = await prisma.system_settings.findUnique({
          where: { setting_key: item.key },
        });

        const valueStr = JSON.stringify(item.value);

        if (existing) {
          return prisma.system_settings.update({
            where: { setting_key: item.key },
            data: {
              setting_value: valueStr,
              description: item.description ?? existing.description,
            },
          });
        }

        return prisma.system_settings.create({
          data: {
            setting_key: item.key,
            setting_value: valueStr,
            description: item.description ?? null,
          },
        });
      })
    );

    return updates.map((s) => ({
      key: s.setting_key,
      value: JSON.parse(s.setting_value),
      description: s.description,
    }));
  }
}

export const settingsService = new SettingsService();
