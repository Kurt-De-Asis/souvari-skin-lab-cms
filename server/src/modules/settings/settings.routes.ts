import { Router } from 'express';
import { settingsController } from './settings.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { updateSettingsSchema } from './settings.validation';

const router = Router();

router.get('/public', settingsController.getPublic);

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', settingsController.getAll);

router.put('/', validate(updateSettingsSchema), settingsController.update);

export default router;
