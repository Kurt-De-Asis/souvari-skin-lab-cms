import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { listNotificationsQuerySchema } from './notifications.validation';

const router = Router();

router.use(authenticate);

router.get('/', validate(listNotificationsQuerySchema, 'query'), notificationsController.list);

router.get('/unread-count', notificationsController.getUnreadCount);

router.patch('/read-all', notificationsController.markAllAsRead);

router.patch('/:id/read', notificationsController.markAsRead);

router.delete('/:id', notificationsController.delete);

export default router;
