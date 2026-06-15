import { Router } from 'express';
import validate from '../../../middleware/validate.middleware';
import videoSessionLikeValidationSchema from '../../../validations/session/video/like.validation';
import videoSessionLikeMiddleware from '../../../middleware/session/video/like.middleware';
import likeController from '../../../controllers/session/video/like.controller';

const likeRouter = Router({
  mergeParams: true,
});

likeRouter
  .route('/')
  .get(
    validate(videoSessionLikeValidationSchema.getVideoSessionLikes),
    videoSessionLikeMiddleware.attachLikeOrNotfound,
    likeController.getVideoSessionLike
  )
  .post(
    validate(videoSessionLikeValidationSchema.createVideoSessionLike),
    videoSessionLikeMiddleware.checkLikeDoesNotExistOrConflict,
    likeController.createVideoSessionLike
  )
  .delete(
    validate(videoSessionLikeValidationSchema.deleteVideoSessionLike),
    videoSessionLikeMiddleware.attachLikeOrNotfound,
    likeController.deleteVideoSessionLike
  );

export default likeRouter;
