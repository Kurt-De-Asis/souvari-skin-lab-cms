import prisma from '../../config/database';
import { hashPassword } from '../../utils/password';
import { AppError } from '../../middleware/errorHandler';
import { PaginationParams, getPaginationParams, createPaginatedResult } from '../../utils/pagination';
import { CreateCustomerInput, UpdateCustomerInput, CustomerQuery } from './customers.validation';

const userInclude = {
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      status: true,
    },
  },
};

export class CustomerService {
  async list(query: CustomerQuery) {
    const { page, limit, skip } = getPaginationParams(query);
    const where: any = { deleted_at: null };

    if (query.search) {
      where.OR = [
        { first_name: { contains: query.search } },
        { last_name: { contains: query.search } },
        { user: { email: { contains: query.search } } },
      ];
    }

    if (query.gender) {
      where.gender = query.gender;
    }

    const orderBy: any = {};
    if (query.sort_by) {
      if (query.sort_by === 'first_name' || query.sort_by === 'last_name') {
        orderBy[query.sort_by] = query.sort_order || 'asc';
      } else {
        orderBy[query.sort_by] = query.sort_order || 'desc';
      }
    } else {
      orderBy.created_at = 'desc';
    }

    const [customers, total] = await Promise.all([
      prisma.customers.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: userInclude,
      }),
      prisma.customers.count({ where }),
    ]);

    return createPaginatedResult(customers, total, { page, limit, skip });
  }

  async getById(id: number) {
    const customer = await prisma.customers.findUnique({
      where: { id },
      include: userInclude,
    });

    if (!customer || customer.deleted_at) {
      throw new AppError('Customer not found', 404);
    }

    return customer;
  }

  async create(data: CreateCustomerInput) {
    const existingUser = await prisma.users.findUnique({ where: { email: data.email } });
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    const passwordHash = await hashPassword(data.password);

    const customer = await prisma.users.create({
      data: {
        email: data.email,
        password_hash: passwordHash,
        role: 'customer',
        phone: data.phone,
        customer: {
          create: {
            first_name: data.first_name,
            last_name: data.last_name,
            date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
            gender: data.gender || null,
            address: data.address || null,
            city: data.city || null,
            state: data.state || null,
            postal_code: data.postal_code || null,
            notes: data.notes || null,
            avatar_url: data.avatar_url || null,
          },
        },
      },
      include: { customer: true },
    });

    return customer;
  }

  async update(id: number, data: UpdateCustomerInput) {
    const customer = await prisma.customers.findUnique({ where: { id } });
    if (!customer || customer.deleted_at) {
      throw new AppError('Customer not found', 404);
    }

    const { phone, email, ...customerData } = data;

    const nullableFields = ['date_of_birth', 'address', 'city', 'state', 'postal_code', 'notes', 'avatar_url', 'gender'];
    const updateData: any = {};
    for (const key of Object.keys(customerData) as (keyof typeof customerData)[]) {
      const val = customerData[key];
      if (val === undefined) continue;
      if (nullableFields.includes(key as string) && val === '') {
        updateData[key] = null;
      } else if (key === 'date_of_birth' && val) {
        updateData[key] = new Date(val as string);
      } else {
        updateData[key] = val;
      }
    }

    if (phone !== undefined || email !== undefined) {
      const userUpdate: any = {};
      if (phone !== undefined) userUpdate.phone = phone || null;
      if (email !== undefined) userUpdate.email = email;
      await prisma.users.update({ where: { id: customer.user_id }, data: userUpdate });
    }

    const updated = await prisma.customers.update({
      where: { id },
      data: updateData,
      include: userInclude,
    });

    return updated;
  }

  async delete(id: number) {
    const customer = await prisma.customers.findUnique({ where: { id } });
    if (!customer || customer.deleted_at) {
      throw new AppError('Customer not found', 404);
    }

    await prisma.customers.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  async getByUserId(userId: number) {
    const customer = await prisma.customers.findFirst({
      where: { user_id: userId, deleted_at: null },
      include: userInclude,
    });

    if (!customer) {
      throw new AppError('Customer profile not found', 404);
    }

    return customer;
  }

  async updateByUserId(userId: number, data: UpdateCustomerInput) {
    const customer = await prisma.customers.findFirst({
      where: { user_id: userId, deleted_at: null },
    });

    if (!customer) {
      throw new AppError('Customer profile not found', 404);
    }

    const { phone, email, ...customerData } = data;

    const nullableFields = ['date_of_birth', 'address', 'city', 'state', 'postal_code', 'notes', 'avatar_url', 'gender'];
    const updateData: any = {};
    for (const key of Object.keys(customerData) as (keyof typeof customerData)[]) {
      const val = customerData[key];
      if (val === undefined) continue;
      if (nullableFields.includes(key as string) && val === '') {
        updateData[key] = null;
      } else if (key === 'date_of_birth' && val) {
        updateData[key] = new Date(val as string);
      } else {
        updateData[key] = val;
      }
    }

    if (phone !== undefined || email !== undefined) {
      const userUpdate: any = {};
      if (phone !== undefined) userUpdate.phone = phone || null;
      if (email !== undefined) userUpdate.email = email;
      await prisma.users.update({ where: { id: userId }, data: userUpdate });
    }

    const updated = await prisma.customers.update({
      where: { id: customer.id },
      data: updateData,
      include: userInclude,
    });

    return updated;
  }
}

export const customerService = new CustomerService();
