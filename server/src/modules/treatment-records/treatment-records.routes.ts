import { Router } from 'express';
import { treatmentRecordsController } from './treatment-records.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  listTreatmentRecordsQuerySchema,
  createTreatmentRecordSchema,
  updateTreatmentRecordSchema,
} from './treatment-records.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listTreatmentRecordsQuerySchema, 'query'),
  treatmentRecordsController.list
);

router.get('/:id', treatmentRecordsController.getById);

router.post(
  '/',
  authorize('staff'),
  validate(createTreatmentRecordSchema),
  treatmentRecordsController.create
);

router.put(
  '/:id',
  authorize('staff', 'admin'),
  validate(updateTreatmentRecordSchema),
  treatmentRecordsController.update
);

export default router;
