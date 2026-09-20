import { Router } from 'express';
import { reviewsController } from './reviews.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createReviewSchema, reviewQuerySchema } from './reviews.validation';

const router = Router();

router.use(authenticate);

router.get('/', authorize('admin'), validate(reviewQuerySchema, 'query'), reviewsController.list);

router.get('/mine', reviewsController.getMine);

router.get('/appointment/:appointmentId', reviewsController.getByAppointment);

router.get('/service/:serviceId/stats', reviewsController.getServiceStats);

router.post('/', validate(createReviewSchema), reviewsController.create);

export default router;