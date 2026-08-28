import { Router } from 'express';
import dataQualityController from './data-quality.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { dataQualityQuerySchema, resolveIssueSchema } from './data-quality.validation';

const router = Router();

router.get('/summary', authenticate, authorize('admin'), dataQualityController.getSummary);
router.post('/scan', authenticate, authorize('admin'), dataQualityController.runScan);
router.get('/', authenticate, authorize('admin'), validate(dataQualityQuerySchema, 'query'), dataQualityController.list);
router.patch('/:id', authenticate, authorize('admin'), validate(resolveIssueSchema), dataQualityController.resolve);

export default router;
