import prisma from '../../config/database';

class ServiceAddonsService {
  async list(query: any) {
    const { service_id, is_active } = query;
    const where: any = {};
    if (service_id) where.service_id = service_id;
    if (is_active !== undefined) where.is_active = is_active;

    return prisma.service_addons.findMany({
      where,
      include: { service: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: number) {
    return prisma.service_addons.findUnique({
      where: { id },
      include: { service: { select: { id: true, name: true } } },
    });
  }

  async create(data: any) {
    return prisma.service_addons.create({
      data: {
        service_id: data.service_id,
        name: data.name,
        description: data.description ?? null,
        price: data.price ?? 0,
        additional_duration_minutes: data.additional_duration_minutes ?? 0,
      },
      include: { service: { select: { id: true, name: true } } },
    });
  }

  async update(id: number, data: any) {
    return prisma.service_addons.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        price: data.price,
        additional_duration_minutes: data.additional_duration_minutes,
        is_active: data.is_active,
      },
      include: { service: { select: { id: true, name: true } } },
    });
  }

  async remove(id: number) {
    return prisma.service_addons.delete({ where: { id } });
  }
}

export default new ServiceAddonsService();
