import prisma from '../../config/database';
import { UpdateSettingsInput } from './settings.validation';

const PUBLIC_KEYS = ['clinic_name', 'clinic_hours', 'clinic_phone', 'clinic_address'];

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
