import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import {
  getPaginationParams,
  createPaginatedResult,
  PaginatedResult,
} from '../../utils/pagination';
import {
  CreateServiceInput,
  UpdateServiceInput,
  ServiceQueryInput,
  BulkAssignStaffInput,
  ConfigureInventoryInput,
  UpdateInventoryItemInput,
  PublicServiceQueryInput,
} from './services.validation';

class ServicesService {
  async list(query: ServiceQueryInput): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);

    const where: any = { deleted_at: null };

    if (query.category) where.category = query.category;
    if (query.status) where.status = query.status;
    if (query.is_active !== undefined) where.is_active = query.is_active;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.services.findMany({
        where,
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          service_staff: {
            include: {
              staff: {
                select: { id: true, first_name: true, last_name: true, position: true },
              },
            },
          },
        },
      }),
      prisma.services.count({ where }),
    ]);

    return createPaginatedResult(data, total, { page, limit, skip });
  }

  async listPublic(query: PublicServiceQueryInput): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);

    const where: any = {
      deleted_at: null,
      is_active: true,
      status: 'active',
    };

    if (query.category) where.category = query.category;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { description: { contains: query.search } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.services.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          description: true,
          category: true,
          price: true,
          duration_minutes: true,
          image_url: true,
          service_staff: {
            include: {
              staff: {
                select: {
                  id: true,
                  first_name: true,
                  last_name: true,
                  position: true,
                  avatar_url: true,
                },
              },
            },
          },
        },
      }),
      prisma.services.count({ where }),
    ]);

    const dataWithStaff = data.map((s: any) => ({
      ...s,
      staff: s.service_staff?.map((ss: any) => ss.staff) || [],
    }));

    return createPaginatedResult(dataWithStaff, total, { page, limit, skip });
  }

  async getById(id: number) {
    const service = await prisma.services.findFirst({
      where: { id, deleted_at: null },
      include: {
        service_staff: {
          include: {
            staff: {
              select: {
                id: true,
                first_name: true,
                last_name: true,
                position: true,
                avatar_url: true,
              },
            },
          },
        },
        service_inventory_items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                unit: true,
                current_stock: true,
              },
            },
          },
        },
      },
    });

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    return service;
  }

  async create(data: CreateServiceInput) {
    const service = await prisma.services.create({
      data: {
        name: data.name,
        description: data.description,
        category: data.category,
        price: data.price,
        duration_minutes: data.duration_minutes,
        image_url: data.image_url,
        is_active: data.is_active,
        status: data.status,
      },
    });

    return service;
  }

  async update(id: number, data: UpdateServiceInput) {
    const existing = await prisma.services.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new AppError('Service not found', 404);
    }

    const service = await prisma.services.update({
      where: { id },
      data,
    });

    return service;
  }

  async delete(id: number) {
    const existing = await prisma.services.findFirst({
      where: { id, deleted_at: null },
    });

    if (!existing) {
      throw new AppError('Service not found', 404);
    }

    await prisma.services.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async assignStaff(serviceId: number, staffId: number) {
    const service = await prisma.services.findFirst({
      where: { id: serviceId, deleted_at: null },
    });

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    const staff = await prisma.staff.findFirst({
      where: { id: staffId, deleted_at: null },
    });

    if (!staff) {
      throw new AppError('Staff not found', 404);
    }

    const existing = await prisma.service_staff.findUnique({
      where: { service_id_staff_id: { service_id: serviceId, staff_id: staffId } },
    });

    if (existing) {
      throw new AppError('Staff is already assigned to this service', 409);
    }

    const assignment = await prisma.service_staff.create({
      data: { service_id: serviceId, staff_id: staffId },
      include: {
        staff: {
          select: { id: true, first_name: true, last_name: true, position: true },
        },
      },
    });

    return assignment;
  }

  async bulkAssignStaff(serviceId: number, data: BulkAssignStaffInput) {
    const service = await prisma.services.findFirst({
      where: { id: serviceId, deleted_at: null },
    });

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    const validStaff = await prisma.staff.findMany({
      where: { id: { in: data.staff_ids }, deleted_at: null },
      select: { id: true },
    });

    if (validStaff.length !== data.staff_ids.length) {
      throw new AppError('One or more staff IDs are invalid', 400);
    }

    const assignments = await prisma.service_staff.createMany({
      data: data.staff_ids.map((staffId) => ({
        service_id: serviceId,
        staff_id: staffId,
      })),
      skipDuplicates: true,
    });

    return { count: assignments.count };
  }

  async removeStaff(serviceId: number, staffId: number) {
    const existing = await prisma.service_staff.findUnique({
      where: { service_id_staff_id: { service_id: serviceId, staff_id: staffId } },
    });

    if (!existing) {
      throw new AppError('Staff is not assigned to this service', 404);
    }

    await prisma.service_staff.delete({
      where: { service_id_staff_id: { service_id: serviceId, staff_id: staffId } },
    });
  }

  async configureInventory(serviceId: number, data: ConfigureInventoryInput) {
    const service = await prisma.services.findFirst({
      where: { id: serviceId, deleted_at: null },
    });

    if (!service) {
      throw new AppError('Service not found', 404);
    }

    const product = await prisma.products.findFirst({
      where: { id: data.product_id, deleted_at: null },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const existing = await prisma.service_inventory_items.findUnique({
      where: {
        service_id_product_id: {
          service_id: serviceId,
          product_id: data.product_id,
        },
      },
    });

    if (existing) {
      throw new AppError('Product is already configured for this service', 409);
    }

    const item = await prisma.service_inventory_items.create({
      data: {
        service_id: serviceId,
        product_id: data.product_id,
        quantity_per_session: data.quantity_per_session,
        is_optional: data.is_optional,
        notes: data.notes,
      },
      include: {
        product: {
          select: { id: true, name: true, sku: true, unit: true, current_stock: true },
        },
      },
    });

    return item;
  }

  async updateInventoryItem(
    serviceId: number,
    itemId: number,
    data: UpdateInventoryItemInput
  ) {
    const existing = await prisma.service_inventory_items.findFirst({
      where: { id: itemId, service_id: serviceId },
    });

    if (!existing) {
      throw new AppError('Inventory item not found for this service', 404);
    }

    const item = await prisma.service_inventory_items.update({
      where: { id: itemId },
      data,
      include: {
        product: {
          select: { id: true, name: true, sku: true, unit: true, current_stock: true },
        },
      },
    });

    return item;
  }

  async removeInventoryItem(serviceId: number, itemId: number) {
    const existing = await prisma.service_inventory_items.findFirst({
      where: { id: itemId, service_id: serviceId },
    });

    if (!existing) {
      throw new AppError('Inventory item not found for this service', 404);
    }

    await prisma.service_inventory_items.delete({
      where: { id: itemId },
    });
  }
}

export const servicesService = new ServicesService();
