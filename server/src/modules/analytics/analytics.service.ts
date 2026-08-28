import prisma from '../../config/database';
import { RevenueQuery, AppointmentTrendsQuery } from './analytics.validation';

class AnalyticsService {
  async getDashboard() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

    const [
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      noShowAppointments,
      monthlyRevenue,
      totalCustomers,
      totalStaff,
    ] = await Promise.all([
      prisma.appointments.count({
        where: {
          appointment_date: { gte: startOfMonth, lte: endOfMonth },
          deleted_at: null,
        },
      }),
      prisma.appointments.count({
        where: {
          appointment_date: { gte: startOfMonth, lte: endOfMonth },
          status: 'completed',
          deleted_at: null,
        },
      }),
      prisma.appointments.count({
        where: {
          appointment_date: { gte: startOfMonth, lte: endOfMonth },
          status: 'cancelled',
          deleted_at: null,
        },
      }),
      prisma.appointments.count({
        where: {
          appointment_date: { gte: startOfMonth, lte: endOfMonth },
          status: 'no_show',
          deleted_at: null,
        },
      }),
      prisma.transactions.aggregate({
        where: {
          created_at: { gte: startOfMonth, lte: endOfMonth },
          payment_status: 'paid',
          deleted_at: null,
        },
        _sum: { total_amount: true },
      }),
      prisma.customers.count({ where: { deleted_at: null } }),
      prisma.staff.count({
        where: { status: 'active', deleted_at: null },
      }),
    ]);

    const lowStockResult = await prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(*) as count FROM products
      WHERE deleted_at IS NULL AND current_stock <= minimum_stock
    `;
    const lowStockCount = Number(lowStockResult[0]?.count || 0);

    return {
      total_appointments: totalAppointments,
      completed: completedAppointments,
      cancelled: cancelledAppointments,
      no_show: noShowAppointments,
      total_revenue: Number(monthlyRevenue._sum.total_amount || 0),
      total_customers: totalCustomers,
      total_staff: totalStaff,
      low_stock_count: lowStockCount,
    };
  }

  async getRevenue(query: RevenueQuery) {
    const { start_date, end_date, group_by } = query;

    const start = start_date ? new Date(start_date) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = end_date ? new Date(end_date + 'T23:59:59.000Z') : new Date();

    const transactions = await prisma.transactions.findMany({
      where: {
        created_at: { gte: start, lte: end },
        payment_status: 'paid',
        deleted_at: null,
      },
      select: {
        total_amount: true,
        created_at: true,
      },
      orderBy: { created_at: 'asc' },
    });

    const grouped: Record<string, number> = {};

    for (const t of transactions) {
      let key: string;
      const date = new Date(t.created_at);

      if (group_by === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (group_by === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = date.toISOString().split('T')[0];
      }

      grouped[key] = (grouped[key] || 0) + Number(t.total_amount);
    }

    const data = Object.entries(grouped).map(([date, revenue]) => ({
      date,
      revenue,
    }));

    return { data, group_by };
  }

  async getAppointmentTrends(query: AppointmentTrendsQuery) {
    const { start_date, end_date } = query;

    const start = start_date ? new Date(start_date) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = end_date ? new Date(end_date + 'T23:59:59.000Z') : new Date();

    const appointments = await prisma.appointments.findMany({
      where: {
        appointment_date: { gte: start, lte: end },
        deleted_at: null,
      },
      select: {
        appointment_date: true,
        status: true,
      },
      orderBy: { appointment_date: 'asc' },
    });

    const grouped: Record<string, Record<string, number>> = {};

    for (const a of appointments) {
      const key = new Date(a.appointment_date).toISOString().split('T')[0];
      if (!grouped[key]) {
        grouped[key] = { total: 0, completed: 0, cancelled: 0, no_show: 0, pending: 0 };
      }
      grouped[key].total += 1;
      if (grouped[key][a.status] !== undefined) {
        grouped[key][a.status] += 1;
      }
    }

    const data = Object.entries(grouped).map(([date, counts]) => ({
      date,
      ...counts,
    }));

    return data;
  }

  async getServices() {
    const services = await prisma.services.findMany({
      where: { deleted_at: null, status: 'active' },
      include: {
        appointments: {
          where: { deleted_at: null },
          select: { id: true },
        },
        transaction_items: {
          select: { line_total: true },
        },
      },
    });

    const serviceData = services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      price: Number(s.price),
      appointment_count: s.appointments.length,
      total_revenue: s.transaction_items.reduce((sum, item) => sum + Number(item.line_total), 0),
    }));

    serviceData.sort((a, b) => b.appointment_count - a.appointment_count);

    return serviceData;
  }

  async getInventory() {
    const [products, lowStockResult, outOfStockResult] = await Promise.all([
      prisma.products.findMany({
        where: { deleted_at: null },
        select: {
          id: true,
          name: true,
          current_stock: true,
          unit_cost: true,
        },
      }),
      prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*) as count FROM products
        WHERE deleted_at IS NULL AND current_stock <= minimum_stock
      `,
      prisma.$queryRaw<{ count: number }[]>`
        SELECT COUNT(*) as count FROM products
        WHERE deleted_at IS NULL AND current_stock = 0
      `,
    ]);

    const lowStockCount = Number(lowStockResult[0]?.count || 0);
    const outOfStockCount = Number(outOfStockResult[0]?.count || 0);

    const totalValue = products.reduce(
      (sum, p) => sum + Number(p.current_stock) * Number(p.unit_cost),
      0
    );

    return {
      total_products: products.length,
      total_value: totalValue,
      low_stock_count: lowStockCount,
      out_of_stock_count: outOfStockCount,
    };
  }
}

export const analyticsService = new AnalyticsService();
