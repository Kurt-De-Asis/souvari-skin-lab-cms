import { Router } from 'express';
import { contactController } from './contact.controller';
import { validate } from '../../middleware/validate';
import { sendContactMessageSchema } from './contact.validation';

const router = Router();

router.post('/', validate(sendContactMessageSchema), contactController.sendMessage);

export default router;