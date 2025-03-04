import { Router } from 'express';
import { liveSessionController } from '../../controllers';
import { liveSessionValidationSchema } from '../../validations';
import validate from '../../middleware/validate';
import {
  attachLiveSessionOrNotfound,
  checkAllowedOrForbidden,
  validateStatusTransitionOrBadRequest,
} from '../../middleware/session/live';

import multer from 'multer';
import { checkOwnerOrForbidden } from '../../middleware/session/live';

const router = Router();

router
  .route('/')
  .post(
    multer().single('thumbnail'),
    validate(liveSessionValidationSchema.createLiveSession),
    liveSessionController.createLiveSession
  );

router
  .route('/:live_session_id')
  .get(
    validate(liveSessionValidationSchema.getLiveSession),
    attachLiveSessionOrNotfound,
    checkAllowedOrForbidden,
    liveSessionController.getLiveSession
  );

router
  .route('/:live_session_id/status')
  .put(
    validate(liveSessionValidationSchema.updateLiveSessionStatus),
    attachLiveSessionOrNotfound,
    checkOwnerOrForbidden,
    validateStatusTransitionOrBadRequest,
    liveSessionController.updateLiveSessionStatus
  );

export default router;
