import { Router } from 'express';
import { aiController } from './ai.controller';
import { optionalAuth } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { sendMessageSchema } from './ai.validation';

const router = Router();

router.post('/', optionalAuth, validate(sendMessageSchema), aiController.sendMessage);

export default router;
