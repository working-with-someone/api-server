import { Router } from 'express';
import { liveSessionController } from '../../controllers';
import { sessionValidationSchema } from '../../validations';
import { liveSessionValidationSchema } from '../../validations';
import validate from '../../middleware/validate';
import { attachSessionOrNotfound } from '../../middleware/session';

import multer from 'multer';
import { checkOwnerOrForbidden } from '../../middleware/session';

const router = Router();

router
  .route('/')
  .post(
    multer().single('thumbnail'),
    validate(liveSessionValidationSchema.createLiveSession),
    liveSessionController.createLiveSession
  );

router
  .route('/:session_id')
  .get(
    validate(sessionValidationSchema.getSession),
    attachSessionOrNotfound,
    liveSessionController.getLiveSession
  );

router
  .route('/:session_id/status')
  .put(
    validate(liveSessionValidationSchema.updateLiveSessionStatus),
    attachSessionOrNotfound,
    checkOwnerOrForbidden,
    liveSessionController.updateLiveSessionStatus
  );

export default router;
