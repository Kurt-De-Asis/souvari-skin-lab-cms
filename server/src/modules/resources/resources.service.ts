import prisma from '../../config/database';
import { getPaginationParams, createPaginatedResult } from '../../utils/pagination';

class ResourcesService {
  async list(query: any) {
    const { type, is_active, search } = query;
    const { page, limit, skip } = getPaginationParams(query);

    const where: any = {};
    if (type) where.type = type;
    if (is_active !== undefined) where.is_active = is_active;
    if (search) where.name = { contains: search };

    const [data, total] = await Promise.all([
      prisma.resources.findMany({
        where,
        include: { _count: { select: { service_resources: true } } },
        orderBy: { name: 'asc' },
        skip, take: limit,
      }),
      prisma.resources.count({ where }),
    ]);

    return createPaginatedResult(data, total, { page, limit, skip });
  }

  async getById(id: number) {
    return prisma.resources.findUnique({
      where: { id },
      include: {
        service_resources: {
          include: { service: { select: { id: true, name: true } } },
        },
      },
    });
  }

  async create(data: any) {
    return prisma.resources.create({ data });
  }

  async update(id: number, data: any) {
    return prisma.resources.update({ where: { id }, data });
  }

  async remove(id: number) {
    const count = await prisma.service_resources.count({ where: { resource_id: id } });
    if (count > 0) {
      throw new Error(`Cannot delete: ${count} services use this resource`);
    }
    return prisma.resources.delete({ where: { id } });
  }

  async assignToService(serviceId: number, resourceIds: number[]) {
    // Remove existing assignments
    await prisma.service_resources.deleteMany({ where: { service_id: serviceId } });
    // Add new ones
    const data = resourceIds.map(rid => ({ service_id: serviceId, resource_id: rid }));
    await prisma.service_resources.createMany({ data });
    return prisma.service_resources.findMany({
      where: { service_id: serviceId },
      include: { resource: true },
    });
  }

  async getResourcesForService(serviceId: number) {
    return prisma.service_resources.findMany({
      where: { service_id: serviceId },
      include: { resource: true },
    });
  }
}

export default new ResourcesService();
