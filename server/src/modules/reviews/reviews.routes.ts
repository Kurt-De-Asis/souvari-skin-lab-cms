import { Router } from 'express';
import { reviewsController } from './reviews.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createReviewSchema, reviewQuerySchema, publicReviewQuerySchema } from './reviews.validation';

const router = Router();

// Public aggregate rating per service (used on the public services pages, no login required).
router.get('/service/:serviceId/stats', reviewsController.getServiceStats);

// Public testimonials for the marketing site (no login required).
// Must stay above `router.use(authenticate)`; returns only masked, non-identifying fields.
router.get(
  '/public',
  validate(publicReviewQuerySchema, 'query'),
  reviewsController.getPublicList
);

router.use(authenticate);

router.get('/', authorize('admin'), validate(reviewQuerySchema, 'query'), reviewsController.list);

router.get('/mine', reviewsController.getMine);

router.get('/appointment/:appointmentId', reviewsController.getByAppointment);

router.post('/', validate(createReviewSchema), reviewsController.create);

export default router;