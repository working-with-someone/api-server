import { Router } from 'express';
import validate from '../../../../middleware/validate.middleware';
import videoSessionCommentLikeValidationSchema from '../../../../validations/session/video/comment/like.validation';
import { videoSessionCommentLikeController } from '../../../../controllers';
import videoSessionCommentLikeMiddleware from '../../../../middleware/session/video/comment/like.middleware';

const videoSessionCommentLikeRouter = Router({
  mergeParams: true,
});

videoSessionCommentLikeRouter
  .route('/')
  .get(
    validate(
      videoSessionCommentLikeValidationSchema.getVideoSessionCommentLike
    ),
    videoSessionCommentLikeMiddleware.attachLikeOrNotfound,
    videoSessionCommentLikeController.getVideoSessionCommentLike
  )
  .post(
    validate(
      videoSessionCommentLikeValidationSchema.createVideoSessionCommentLike
    ),
    videoSessionCommentLikeMiddleware.checkLikeDoesNotExistOrConflict,
    videoSessionCommentLikeController.createVideoSessionCommentLike
  )
  .delete(
    validate(
      videoSessionCommentLikeValidationSchema.deleteVideoSessionCommentLike
    ),
    videoSessionCommentLikeMiddleware.attachLikeOrNotfound,
    videoSessionCommentLikeController.deleteVideoSessionCommentLike
  );

export default videoSessionCommentLikeRouter;
