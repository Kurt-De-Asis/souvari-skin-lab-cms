import { Router } from 'express';
import posController from './pos.controller';
import { authenticate } from '../../middleware/auth';
import { validate } from '../../middleware/validate';
import { posQuoteSchema, posCheckoutSchema } from './pos.validation';

const router = Router();

router.post('/quote', authenticate, validate(posQuoteSchema), posController.getQuote);
router.post('/checkout', authenticate, validate(posCheckoutSchema), posController.checkout);

export default router;
