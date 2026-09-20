import prisma from '../config/database';
import { getSMSProvider } from './sms.service';
import logger from '../utils/logger';
import { NotificationType } from '@prisma/client';

interface DispatchParams {
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  sendSMS?: boolean;
  smsPhone?: string;
}

class NotificationDispatchService {
  async dispatch(params: DispatchParams): Promise<{ notification: any; smsSent: boolean }> {
    const { userId, type, title, message, data, sendSMS = false, smsPhone } = params;

    // 1. Create in-app notification
    const notification = await prisma.notifications.create({
      data: {
        user_id: userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        status: 'unread',
      },
    });

    // 2. Send SMS if requested and phone is available
    let smsSent = false;
    if (sendSMS && smsPhone) {
      try {
        const provider = getSMSProvider();
        const result = await provider.send(smsPhone, message);

        await prisma.sms_logs.create({
          data: {
            user_id: userId,
            recipient_phone: smsPhone,
            message,
            status: result.success ? 'sent' : 'failed',
            external_id: result.externalId ?? null,
            error_message: result.error ?? null,
            sent_at: result.success ? new Date() : null,
          },
        });

        smsSent = result.success;
      } catch (err: any) {
        logger.error(`[NOTIFICATION] SMS failed for user ${userId}: ${err.message}`);
      }
    }

    return { notification, smsSent };
  }

  async dispatchAppointmentStatus(params: {
    appointmentId: number;
    oldStatus: string;
    newStatus: string;
    customerUserId: number;
    customerName: string;
    customerPhone?: string | null;
    staffUserId: number | null;
    staffName: string;
    serviceName: string;
    appointmentDate: string;
    appointmentTime: string;
    cancellationReason?: string | null;
    adminUserIds: number[];
  }): Promise<void> {
    const {
      appointmentId, oldStatus, newStatus,
      customerUserId, customerName, customerPhone,
      staffUserId, staffName,
      serviceName, appointmentDate, appointmentTime,
      cancellationReason, adminUserIds,
    } = params;

    const statusMessages: Record<string, { title: string; message: string; type: NotificationType }> = {
      confirmed: {
        title: 'Appointment Confirmed',
        message: `Your ${serviceName} appointment on ${appointmentDate} at ${appointmentTime} has been confirmed.`,
        type: 'appointment_update',
      },
      checked_in: {
        title: 'Checked In',
        message: `You've been checked in for your ${serviceName} session.`,
        type: 'appointment_update',
      },
      in_progress: {
        title: 'Session In Progress',
        message: `Your ${serviceName} session has started.`,
        type: 'appointment_update',
      },
      completed: {
        title: 'Session Completed',
        message: `Your ${serviceName} session is complete. Thank you for visiting Souvari Skin Lab!`,
        type: 'appointment_update',
      },
      cancelled: {
        title: 'Appointment Cancelled',
        message: `Your ${serviceName} appointment on ${appointmentDate} has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ''}`,
        type: 'appointment_update',
      },
      no_show: {
        title: 'Appointment Marked No-Show',
        message: `Your appointment for ${serviceName} on ${appointmentDate} was marked as a no-show.`,
        type: 'appointment_update',
      },
    };

    const mapping = statusMessages[newStatus];
    if (!mapping) return;

    // Notify customer (in-app + SMS)
    await this.dispatch({
      userId: customerUserId,
      type: mapping.type,
      title: mapping.title,
      message: mapping.message,
      data: { appointment_id: appointmentId, old_status: oldStatus, new_status: newStatus },
      sendSMS: true,
      smsPhone: customerPhone ?? undefined,
    });

    // Notify assigned staff (in-app only)
    if (staffUserId) {
      const staffTitle = newStatus === 'confirmed'
        ? 'New Confirmed Appointment'
        : newStatus === 'cancelled'
        ? 'Appointment Cancelled'
        : `Appointment Status: ${newStatus.replace('_', ' ')}`;

      const staffMessage = newStatus === 'cancelled'
        ? `Appointment #${appointmentId} for ${customerName} on ${appointmentDate} has been cancelled.`
        : `Appointment #${appointmentId} for ${customerName} — ${serviceName} on ${appointmentDate} at ${appointmentTime} — status: ${newStatus.replace('_', ' ')}.`;

      await this.dispatch({
        userId: staffUserId,
        type: 'appointment_update',
        title: staffTitle,
        message: staffMessage,
        data: { appointment_id: appointmentId, new_status: newStatus },
        sendSMS: false,
      });
    }

    // Notify admins (in-app only)
    for (const adminId of adminUserIds) {
      await this.dispatch({
        userId: adminId,
        type: 'appointment_update',
        title: `Appointment ${newStatus.replace('_', ' ')}`,
        message: `Appointment #${appointmentId}: ${customerName} — ${serviceName} on ${appointmentDate} at ${appointmentTime} — status: ${newStatus.replace('_', ' ')}.`,
        data: { appointment_id: appointmentId, new_status: newStatus },
        sendSMS: false,
      });
    }
  }

  async dispatchAppointmentRescheduled(params: {
    appointmentId: number;
    customerUserId: number;
    customerName: string;
    customerPhone?: string | null;
    staffUserId: number | null;
    staffName: string;
    serviceName: string;
    oldDate: string;
    oldTime: string;
    newDate: string;
    newTime: string;
    reason?: string | null;
    adminUserIds: number[];
  }): Promise<void> {
    const {
      appointmentId, customerUserId, customerName, customerPhone,
      staffUserId, staffName, serviceName,
      oldDate, oldTime, newDate, newTime, reason, adminUserIds,
    } = params;

    const reasonText = reason?.trim() ? ` Reason: ${reason.trim()}` : '';

    // Notify customer (in-app + SMS)
    await this.dispatch({
      userId: customerUserId,
      type: 'appointment_update',
      title: 'Appointment Rescheduled',
      message: `Your ${serviceName} appointment has been rescheduled from ${oldDate} at ${oldTime} to ${newDate} at ${newTime}.${reasonText}`,
      data: { appointment_id: appointmentId, rescheduled: true, reason: reason?.trim() ?? null },
      sendSMS: true,
      smsPhone: customerPhone ?? undefined,
    });

    // Notify assigned staff (in-app only)
    if (staffUserId) {
      await this.dispatch({
        userId: staffUserId,
        type: 'appointment_update',
        title: 'Appointment Rescheduled',
        message: `Appointment #${appointmentId} for ${customerName} — ${serviceName} has been rescheduled from ${oldDate} at ${oldTime} to ${newDate} at ${newTime}.`,
        data: { appointment_id: appointmentId, rescheduled: true },
        sendSMS: false,
      });
    }

    // Notify admins (in-app only)
    for (const adminId of adminUserIds) {
      await this.dispatch({
        userId: adminId,
        type: 'appointment_update',
        title: 'Appointment Rescheduled',
        message: `Appointment #${appointmentId}: ${customerName} — ${serviceName} rescheduled from ${oldDate} at ${oldTime} to ${newDate} at ${newTime} by ${staffName}.`,
        data: { appointment_id: appointmentId, rescheduled: true },
        sendSMS: false,
      });
    }
  }

  async dispatchNewBooking(params: {
    appointmentId: number;
    customerUserId: number;
    customerName: string;
    customerPhone?: string | null;
    staffUserId: number;
    staffName: string;
    serviceName: string;
    appointmentDate: string;
    appointmentTime: string;
    quotedPrice: number | null;
    adminUserIds: number[];
  }): Promise<void> {
    const {
      appointmentId, customerUserId, customerName, customerPhone,
      staffUserId, staffName, serviceName,
      appointmentDate, appointmentTime, quotedPrice, adminUserIds,
    } = params;

    // Notify customer (in-app + SMS)
    const priceStr = quotedPrice ? ` for ₱${Number(quotedPrice).toLocaleString()}` : '';
    await this.dispatch({
      userId: customerUserId,
      type: 'appointment_reminder',
      title: 'Appointment Booked',
      message: `Your ${serviceName} appointment has been booked for ${appointmentDate} at ${appointmentTime}${priceStr}. Reference: #${appointmentId}`,
      data: { appointment_id: appointmentId },
      sendSMS: true,
      smsPhone: customerPhone ?? undefined,
    });

    // Notify assigned staff (in-app only)
    await this.dispatch({
      userId: staffUserId,
      type: 'appointment_reminder',
      title: 'New Appointment',
      message: `New booking: ${customerName} booked ${serviceName} for ${appointmentDate} at ${appointmentTime}.`,
      data: { appointment_id: appointmentId },
      sendSMS: false,
    });

    // Notify admins (in-app only)
    for (const adminId of adminUserIds) {
      await this.dispatch({
        userId: adminId,
        type: 'appointment_reminder',
        title: 'New Booking',
        message: `New booking: ${customerName} booked ${serviceName} with ${staffName} for ${appointmentDate} at ${appointmentTime}.`,
        data: { appointment_id: appointmentId },
        sendSMS: false,
      });
    }
  }

  async getAdminUserIds(): Promise<number[]> {
    const admins = await prisma.users.findMany({
      where: { role: 'admin', deleted_at: null },
      select: { id: true },
    });
    return admins.map((a) => a.id);
  }
}

export const notificationDispatch = new NotificationDispatchService();
