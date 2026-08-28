import prisma from '../../config/database';

class MembershipFamiliesService {
  async list(query: any) {
    const { is_active, include_plans } = query;

    const where: any = {};
    if (is_active !== undefined) where.is_active = is_active;

    const families = await prisma.membership_families.findMany({
      where,
      include: {
        plans: include_plans === 'true' ? {
          where: { is_active: true },
          include: {
            installment_options: { where: { is_active: true } },
          },
          orderBy: [{ variant_code: 'asc' }, { term_months: 'asc' }],
        } : false,
        benefits: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' },
        },
      },
      orderBy: { display_order: 'asc' },
    });

    return families;
  }

  async getById(id: number) {
    return prisma.membership_families.findUnique({
      where: { id },
      include: {
        plans: {
          where: { is_active: true },
          include: { installment_options: { where: { is_active: true } } },
          orderBy: [{ variant_code: 'asc' }, { term_months: 'asc' }],
        },
        benefits: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    });
  }

  async getByCode(code: string) {
    return prisma.membership_families.findUnique({
      where: { code: code as any },
      include: {
        plans: {
          where: { is_active: true },
          include: { installment_options: { where: { is_active: true } } },
          orderBy: [{ variant_code: 'asc' }, { term_months: 'asc' }],
        },
        benefits: {
          where: { is_active: true },
          orderBy: { sort_order: 'asc' },
        },
      },
    });
  }

  async create(data: any) {
    return prisma.membership_families.create({
      data: {
        code: data.code,
        name: data.name,
        tagline: data.tagline ?? null,
        description: data.description ?? null,
        eligible_categories: data.eligible_categories ?? undefined,
        display_order: data.display_order ?? 0,
        is_active: data.is_active ?? true,
      },
    });
  }

  async update(id: number, data: any) {
    return prisma.membership_families.update({
      where: { id },
      data: {
        name: data.name,
        tagline: data.tagline,
        description: data.description,
        eligible_categories: data.eligible_categories,
        display_order: data.display_order,
        is_active: data.is_active,
      },
    });
  }
}

export default new MembershipFamiliesService();
