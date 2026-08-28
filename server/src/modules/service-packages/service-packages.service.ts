import prisma from '../../config/database';
import { createPaginatedResult } from '../../utils/pagination';
import { Prisma } from '@prisma/client';

class ServicePackagesService {
  async list(query: any) {
    const { page = '1', limit = '20', group_slug, search } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};
    if (group_slug) {
      const group = await prisma.service_groups.findUnique({ where: { slug: group_slug } });
      if (group) where.service = { group_id: group.id };
    }
    if (search) {
      where.service = { ...where.service, name: { contains: search } };
    }

    const [packages, total] = await Promise.all([
      prisma.service_packages.findMany({
        where,
        include: { service: { select: { id: true, name: true, slug: true, category: true, duration_minutes: true } } },
        orderBy: { service: { name: 'asc' } },
        skip, take,
      }),
      prisma.service_packages.count({ where }),
    ]);

    return createPaginatedResult(packages, total, { page: parseInt(page), limit: take, skip });
  }

  async getById(id: number) {
    return prisma.service_packages.findUnique({
      where: { id },
      include: { service: true },
    });
  }

  async create(data: any) {
    return prisma.service_packages.create({
      data: {
        service_id: data.service_id,
        sessions_included: data.sessions_included ?? 7,
        session_price: data.session_price,
        ten_session_price: data.ten_session_price ?? null,
        inclusions: data.inclusions ?? Prisma.JsonNull,
        savings_note: data.savings_note ?? null,
      },
      include: { service: true },
    });
  }

  async update(id: number, data: any) {
    return prisma.service_packages.update({
      where: { id },
      data: {
        sessions_included: data.sessions_included,
        session_price: data.session_price,
        ten_session_price: data.ten_session_price,
        inclusions: data.inclusions ?? undefined,
        savings_note: data.savings_note,
      },
      include: { service: true },
    });
  }

  async remove(id: number) {
    return prisma.service_packages.delete({ where: { id } });
  }
}

export default new ServicePackagesService();
