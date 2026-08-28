import prisma from '../../config/database';
import { createPaginatedResult } from '../../utils/pagination';

class DataQualityService {
  async list(query: any) {
    const { page = '1', limit = '20', status, severity, issue_type, service_id } = query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const where: any = {};
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (issue_type) where.issue_type = issue_type;
    if (service_id) where.service_id = service_id;

    const [issues, total] = await Promise.all([
      prisma.service_data_issues.findMany({
        where,
        orderBy: [{ severity: 'asc' }, { created_at: 'desc' }],
        skip, take,
      }),
      prisma.service_data_issues.count({ where }),
    ]);

    return createPaginatedResult(issues, total, { page: parseInt(page), limit: take, skip });
  }

  async getSummary() {
    const [byStatus, bySeverity, totalCount] = await Promise.all([
      prisma.service_data_issues.groupBy({ by: ['status'], _count: true }),
      prisma.service_data_issues.groupBy({ by: ['severity'], _count: true }),
      prisma.service_data_issues.count(),
    ]);

    return {
      total: totalCount,
      by_status: Object.fromEntries(byStatus.map(r => [r.status, r._count])),
      by_severity: Object.fromEntries(bySeverity.map(r => [r.severity, r._count])),
    };
  }

  async resolve(id: number, data: any) {
    return prisma.service_data_issues.update({
      where: { id },
      data: {
        status: data.status,
        resolved_by: data.resolved_by ?? null,
        resolved_at: data.status === 'resolved' ? new Date() : null,
      },
    });
  }

  async runScan() {
    let newIssues = 0;

    // Scan for services with zero available prices
    const servicesWithoutPrices = await prisma.services.findMany({
      where: { is_active: true, is_legacy: false, prices: { none: { is_available: true } } },
    });
    for (const svc of servicesWithoutPrices) {
      const existing = await prisma.service_data_issues.findFirst({
        where: { service_id: svc.id, issue_type: 'missing_price', status: { not: 'resolved' } },
      });
      if (!existing) {
        await prisma.service_data_issues.create({
          data: {
            service_id: svc.id,
            issue_type: 'missing_price',
            severity: 'critical',
            status: 'open',
            title: `No available prices for ${svc.name}`,
          },
        });
        newIssues++;
      }
    }

    return { new_issues: newIssues, scanned_at: new Date() };
  }
}

export default new DataQualityService();
