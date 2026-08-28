import prisma from '../../config/database';
import { createPaginatedResult } from '../../utils/pagination';

class ServicePricesService {
  async list(query: any) {
    const { page = '1', limit = '20', service_id, group_slug, audience, staff_tier, available, needs_verification } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};
    if (service_id) where.service_id = service_id;
    if (audience) where.audience = audience;
    if (staff_tier) where.staff_tier = staff_tier;
    if (available !== undefined) where.is_available = available;
    if (needs_verification !== undefined) where.needs_verification = needs_verification;
    if (group_slug) {
      const group = await prisma.service_groups.findUnique({ where: { slug: group_slug } });
      if (group) {
        where.service = { group_id: group.id };
      }
    }

    const [prices, total] = await Promise.all([
      prisma.service_prices.findMany({
        where,
        include: { service: { select: { id: true, name: true, slug: true, category: true } }, variant: true },
        orderBy: [{ service_id: 'asc' }, { service_variant_id: 'asc' }, { audience: 'asc' }],
        skip, take,
      }),
      prisma.service_prices.count({ where }),
    ]);

    return createPaginatedResult(prices, total, { page: parseInt(page), limit: take, skip });
  }

  async getMatrix(group_slug?: string, service_id?: number) {
    const serviceWhere: any = { is_active: true };
    if (service_id) serviceWhere.id = service_id;
    if (group_slug) {
      const group = await prisma.service_groups.findUnique({ where: { slug: group_slug } });
      if (group) serviceWhere.group_id = group.id;
    }

    const services = await prisma.services.findMany({
      where: serviceWhere,
      include: {
        variants: { where: { is_active: true }, orderBy: { display_order: 'asc' } },
        prices: { where: { is_available: true }, orderBy: [{ audience: 'asc' }, { staff_tier: 'asc' }, { gender_scope: 'asc' }] },
      },
      orderBy: { name: 'asc' },
    });

    return services.map(svc => ({
      service: { id: svc.id, name: svc.name, slug: svc.slug, category: svc.category },
      variants: svc.variants.map(v => ({ id: v.id, key: v.variant_key, label: v.label })),
      prices: svc.prices.map(p => ({
        id: p.id,
        audience: p.audience,
        staff_tier: p.staff_tier,
        gender_scope: p.gender_scope,
        amount: Number(p.amount),
        variant_id: p.service_variant_id,
        needs_verification: p.needs_verification,
        source_ref: p.source_ref,
      })),
    }));
  }

  async update(id: number, data: any) {
    return prisma.service_prices.update({ where: { id }, data });
  }

  async bulkUpdate(updates: Array<{ id: number; amount?: number; is_available?: boolean; needs_verification?: boolean }>) {
    return prisma.$transaction(
      updates.map(u => prisma.service_prices.update({
        where: { id: u.id },
        data: { amount: u.amount, is_available: u.is_available, needs_verification: u.needs_verification },
      }))
    );
  }
}

export default new ServicePricesService();
