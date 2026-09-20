import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { revenueQuerySchema, appointmentTrendsQuerySchema, summaryQuerySchema } from './analytics.validation';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard', analyticsController.getDashboard);

router.get('/revenue', validate(revenueQuerySchema, 'query'), analyticsController.getRevenue);

router.get(
  '/appointments',
  validate(appointmentTrendsQuerySchema, 'query'),
  analyticsController.getAppointmentTrends
);

router.get('/services', analyticsController.getServices);

router.get('/inventory', analyticsController.getInventory);

router.get('/summary', validate(summaryQuerySchema, 'query'), analyticsController.getSummary);

export default router;
