import { Router } from 'express';
import { liveSessionController } from '../../controllers';
import { liveSessionValidationSchema } from '../../validations';
import validate from '../../middleware/validate';

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

export default router;