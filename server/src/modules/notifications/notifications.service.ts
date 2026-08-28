import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import {
  getPaginationParams,
  createPaginatedResult,
  PaginatedResult,
} from '../../utils/pagination';
import { ListNotificationsQuery } from './notifications.validation';

class NotificationsService {
  async list(
    query: ListNotificationsQuery,
    userId: number
  ): Promise<PaginatedResult<any>> {
    const { page, limit, skip } = getPaginationParams(query);
    const { type, status } = query;

    const where: any = { user_id: userId };

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    const [notifications, total] = await Promise.all([
      prisma.notifications.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      prisma.notifications.count({ where }),
    ]);

    return createPaginatedResult(notifications, total, { page, limit, skip });
  }

  async getUnreadCount(userId: number) {
    const count = await prisma.notifications.count({
      where: {
        user_id: userId,
        status: 'unread',
      },
    });

    return { count };
  }

  async markAsRead(id: number, userId: number) {
    const notification = await prisma.notifications.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }

    const updated = await prisma.notifications.update({
      where: { id },
      data: {
        status: 'read',
        read_at: new Date(),
      },
    });

    return updated;
  }

  async markAllAsRead(userId: number) {
    await prisma.notifications.updateMany({
      where: {
        user_id: userId,
        status: 'unread',
      },
      data: {
        status: 'read',
        read_at: new Date(),
      },
    });

    return { message: 'All notifications marked as read' };
  }

  async delete(id: number, userId: number) {
    const notification = await prisma.notifications.findUnique({
      where: { id },
    });

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    if (notification.user_id !== userId) {
      throw new AppError('Access denied', 403);
    }

    await prisma.notifications.delete({
      where: { id },
    });
  }
}

export const notificationsService = new NotificationsService();
