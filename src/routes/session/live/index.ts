import { Router } from 'express';
import { liveSessionController } from '../../../controllers';
import { liveSessionValidationSchema } from '../../../validations';
import validate from '../../../middleware/validate';
import liveSessionMiddleware from '../../../middleware/session/live';
import multer from 'multer';
import breakTimeRouter from './break-time';

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
    liveSessionMiddleware.attachLiveSessionOrNotfound,
    liveSessionMiddleware.checkAllowedOrForbidden,
    liveSessionController.getLiveSession
  );

router
  .route('/:live_session_id/status')
  .put(
    validate(liveSessionValidationSchema.updateLiveSessionStatus),
    liveSessionMiddleware.attachLiveSessionOrNotfound,
    liveSessionMiddleware.checkOwnerOrForbidden,
    liveSessionMiddleware.validateStatusTransitionOrBadRequest,
    liveSessionController.updateLiveSessionStatus
  );

router.use('/:live_session_id/break_time', breakTimeRouter);

export default router;
