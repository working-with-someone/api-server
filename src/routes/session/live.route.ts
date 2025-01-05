import { Router } from 'express';
import { liveSessionController } from '../../controllers';
import { liveSessionValidationSchema } from '../../validations';
import validate from '../../middleware/validate';
import { sessionPermission } from '../../middleware/permission';

import multer from 'multer';

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
    liveSessionController.getLiveSession
  );

router
  .route('/:live_session_id/status')
  .put(
    validate(liveSessionValidationSchema.updateLiveSessionStatus),
    sessionPermission,
    liveSessionController.updateLiveSessionStatus
  );

export default router;
