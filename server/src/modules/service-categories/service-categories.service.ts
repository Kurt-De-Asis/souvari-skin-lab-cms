import prisma from '../../config/database';
import { getPaginationParams, createPaginatedResult } from '../../utils/pagination';

class ServiceCategoriesService {
  async list(query: any) {
    const { page = '1', limit = '50', is_active, search } = query;
    const { page: p, limit: l, skip } = getPaginationParams(query);

    const where: any = {};
    if (is_active !== undefined) where.is_active = is_active;
    if (search) where.name = { contains: search };

    const [data, total] = await Promise.all([
      prisma.service_categories.findMany({
        where,
        include: { _count: { select: { services: true } } },
        orderBy: { sort_order: 'asc' },
        skip, take: l,
      }),
      prisma.service_categories.count({ where }),
    ]);

    return createPaginatedResult(data, total, { page: p, limit: l, skip });
  }

  async browse() {
    const [data, total] = await Promise.all([
      prisma.service_categories.findMany({
        where: { is_active: true },
        include: {
          _count: {
            select: { services: { where: { is_active: true, status: 'active', deleted_at: null } } },
          },
        },
        orderBy: { sort_order: 'asc' },
      }),
      prisma.service_categories.count({ where: { is_active: true } }),
    ]);

    return createPaginatedResult(data, total, { page: 1, limit: total, skip: 0 });
  }

  async getById(id: number) {
    return prisma.service_categories.findUnique({
      where: { id },
      include: { services: { select: { id: true, name: true, status: true } } },
    });
  }

  async create(data: any) {
    return prisma.service_categories.create({ data });
  }

  async update(id: number, data: any) {
    return prisma.service_categories.update({ where: { id }, data });
  }

  async remove(id: number) {
    // Check if any services use this category
    const count = await prisma.services.count({ where: { category_id: id } });
    if (count > 0) {
      throw new Error(`Cannot delete: ${count} services use this category`);
    }
    return prisma.service_categories.delete({ where: { id } });
  }
}

export default new ServiceCategoriesService();
