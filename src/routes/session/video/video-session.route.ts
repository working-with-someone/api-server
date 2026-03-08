import { Router } from 'express';
import { videoSessionController } from '../../../controllers';
import { videoSessionValidationSchema } from '../../../validations';
import validate from '../../../middleware/validate.middleware';
import videoSessionMiddleware from '../../../middleware/session/video/video-session.middleware';
import multer from 'multer';

const videoSessionRouter = Router();

videoSessionRouter
  .route('/')
  .get(
    validate(videoSessionValidationSchema.getVideoSessions),
    videoSessionController.getVideoSessions
  );

videoSessionRouter
  .route('/')
  .post(
    multer().single('thumbnail'),
    validate(videoSessionValidationSchema.createVideoSession),
    videoSessionController.createVideoSession
  );

videoSessionRouter
  .route('/:video_session_id')
  .get(
    validate(videoSessionValidationSchema.getVideoSession),
    videoSessionMiddleware.attachVideoSessionOrNotfound,
    videoSessionMiddleware.checkAllowedOrForbidden,
    videoSessionController.getVideoSession
  );

videoSessionRouter
  .route('/:video_session_id')
  .put(
    multer().single('thumbnail'),
    validate(videoSessionValidationSchema.updateVideoSession),
    videoSessionMiddleware.attachVideoSessionOrNotfound,
    videoSessionMiddleware.checkOwnerOrForbidden,
    videoSessionController.updateVideoSession
  );

export default videoSessionRouter;
