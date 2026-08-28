import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import { getPaginationParams, createPaginatedResult, PaginatedResult } from '../../utils/pagination';
import {
  CreateStaffInput,
  UpdateStaffInput,
  StaffQueryInput,
  UpdateSchedulesInput,
  AssignServiceInput,
} from './staff.validation';

const staffInclude = {
  user: {
    select: {
      id: true,
      email: true,
      phone: true,
      role: true,
      status: true,
    },
  },
  service_staff: {
    include: {
      service: {
        select: {
          id: true,
          name: true,
          category: true,
          price: true,
          duration_minutes: true,
        },
      },
    },
  },
};

export class StaffService {
  async findAll(query: StaffQueryInput): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);
    const where: any = { deleted_at: null };

    if (query.search) {
      where.OR = [
        { first_name: { contains: query.search } },
        { last_name: { contains: query.search } },
        { user: { email: { contains: query.search } } },
      ];
    }

    if (query.position) where.position = query.position;
    if (query.status) where.status = query.status;

    const [data, total] = await Promise.all([
      prisma.staff.findMany({
        where,
        include: staffInclude,
        skip,
        take: limit,
        orderBy: { last_name: 'asc' },
      }),
      prisma.staff.count({ where }),
    ]);

    return createPaginatedResult(data, total, { page, limit, skip });
  }

  async findById(id: number) {
    const staff = await prisma.staff.findFirst({
      where: { id, deleted_at: null },
      include: staffInclude,
    });

    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    return staff;
  }

  async create(data: CreateStaffInput) {
    const existingUser = await prisma.users.findUnique({ where: { id: data.user_id } });
    if (!existingUser) {
      throw new AppError('User not found', 404);
    }

    const existingStaff = await prisma.staff.findUnique({ where: { user_id: data.user_id } });
    if (existingStaff) {
      throw new AppError('Staff profile already exists for this user', 409);
    }

    await prisma.users.update({
      where: { id: data.user_id },
      data: { role: 'staff' },
    });

    const staff = await prisma.staff.create({
      data: {
        user_id: data.user_id,
        first_name: data.first_name,
        last_name: data.last_name,
        position: data.position as any,
        job_title: data.job_title ?? null,
        permission_level: data.permission_level as any ?? 'medium',
        rating: data.rating ?? null,
        status: data.status as any,
        hire_date: data.hire_date ? new Date(data.hire_date) : null,
        date_of_birth: data.date_of_birth ? new Date(data.date_of_birth) : null,
        gender: data.gender as any ?? null,
        address: data.address ?? null,
        avatar_url: data.avatar_url ?? null,
        bio: data.bio ?? null,
        notes: data.notes ?? null,
      },
      include: staffInclude,
    });

    return staff;
  }

  async update(id: number, data: UpdateStaffInput) {
    const existing = await prisma.staff.findFirst({ where: { id, deleted_at: null } });
    if (!existing) {
      throw new AppError('Staff member not found', 404);
    }

    const updateData: any = {};
    if (data.first_name !== undefined) updateData.first_name = data.first_name;
    if (data.last_name !== undefined) updateData.last_name = data.last_name;
    if (data.hire_date !== undefined) updateData.hire_date = data.hire_date ? new Date(data.hire_date) : null;
    if (data.date_of_birth !== undefined) updateData.date_of_birth = data.date_of_birth ? new Date(data.date_of_birth) : null;
    if (data.position !== undefined) updateData.position = data.position;
    if (data.job_title !== undefined) updateData.job_title = data.job_title;
    if (data.permission_level !== undefined) updateData.permission_level = data.permission_level;
    if (data.rating !== undefined) updateData.rating = data.rating;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.address !== undefined) updateData.address = data.address;
    if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.notes !== undefined) updateData.notes = data.notes;

    const staff = await prisma.staff.update({
      where: { id },
      data: updateData,
      include: staffInclude,
    });

    return staff;
  }

  async remove(id: number) {
    const existing = await prisma.staff.findFirst({ where: { id, deleted_at: null } });
    if (!existing) {
      throw new AppError('Staff member not found', 404);
    }

    await prisma.staff.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'inactive' as any },
    });
  }

  async getSchedules(staffId: number) {
    const staff = await prisma.staff.findFirst({ where: { id: staffId, deleted_at: null } });
    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    const schedules = await prisma.staff_schedules.findMany({
      where: { staff_id: staffId },
      orderBy: { day_of_week: 'asc' },
    });

    return schedules;
  }

  async updateSchedules(staffId: number, data: UpdateSchedulesInput) {
    const staff = await prisma.staff.findFirst({ where: { id: staffId, deleted_at: null } });
    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    await prisma.$transaction(
      data.schedules.map((entry) =>
        prisma.staff_schedules.upsert({
          where: {
            staff_id_day_of_week: {
              staff_id: staffId,
              day_of_week: entry.day_of_week as any,
            },
          },
          update: {
            start_time: entry.start_time,
            end_time: entry.end_time,
            break_start: entry.break_start ?? null,
            break_end: entry.break_end ?? null,
            is_active: entry.is_active ?? true,
          },
          create: {
            staff_id: staffId,
            day_of_week: entry.day_of_week as any,
            start_time: entry.start_time,
            end_time: entry.end_time,
            break_start: entry.break_start ?? null,
            break_end: entry.break_end ?? null,
            is_active: entry.is_active ?? true,
          },
        })
      )
    );

    return this.getSchedules(staffId);
  }

  async getAvailability(staffId: number, date: string) {
    const staff = await prisma.staff.findFirst({ where: { id: staffId, deleted_at: null } });
    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayOfWeek = days[new Date(date + 'T12:00:00').getDay()] as any;

    const schedule = await prisma.staff_schedules.findUnique({
      where: {
        staff_id_day_of_week: {
          staff_id: staffId,
          day_of_week: dayOfWeek,
        },
      },
    });

    return {
      staff_id: staffId,
      date,
      day_of_week: dayOfWeek,
      schedule: schedule || null,
      available: schedule?.is_active ?? false,
    };
  }

  async assignService(staffId: number, data: AssignServiceInput) {
    const staff = await prisma.staff.findFirst({ where: { id: staffId, deleted_at: null } });
    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    const service = await prisma.services.findFirst({
      where: { id: data.service_id, deleted_at: null },
    });
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    const existing = await prisma.service_staff.findUnique({
      where: {
        service_id_staff_id: {
          service_id: data.service_id,
          staff_id: staffId,
        },
      },
    });

    if (existing) {
      throw new AppError('Service already assigned to this staff member', 409);
    }

    const assignment = await prisma.service_staff.create({
      data: {
        service_id: data.service_id,
        staff_id: staffId,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            duration_minutes: true,
          },
        },
      },
    });

    return assignment;
  }

  async unassignService(staffId: number, serviceId: number) {
    const existing = await prisma.service_staff.findUnique({
      where: {
        service_id_staff_id: {
          service_id: serviceId,
          staff_id: staffId,
        },
      },
    });

    if (!existing) {
      throw new AppError('Service assignment not found', 404);
    }

    await prisma.service_staff.delete({
      where: {
        service_id_staff_id: {
          service_id: serviceId,
          staff_id: staffId,
        },
      },
    });
  }

  async getAssignedServices(staffId: number) {
    const staff = await prisma.staff.findFirst({ where: { id: staffId, deleted_at: null } });
    if (!staff) {
      throw new AppError('Staff member not found', 404);
    }

    const assignments = await prisma.service_staff.findMany({
      where: { staff_id: staffId },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            price: true,
            duration_minutes: true,
            is_active: true,
          },
        },
      },
    });

    return assignments;
  }

  async getStaffByService(serviceId: number) {
    const service = await prisma.services.findFirst({
      where: { id: serviceId, deleted_at: null },
    });
    if (!service) {
      throw new AppError('Service not found', 404);
    }

    const staffList = await prisma.staff.findMany({
      where: {
        deleted_at: null,
        status: 'active' as any,
        service_staff: {
          some: { service_id: serviceId },
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { last_name: 'asc' },
    });

    return staffList;
  }
}

export const staffService = new StaffService();
