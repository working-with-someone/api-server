import { Router } from 'express';
import validate from '../../../../middleware/validate.middleware';
import { videoSessionCommentValidationSchema } from '../../../../validations';
import videoSessionMiddleware from '../../../../middleware/session/video/video-session.middleware';
import { videoSessionCommentController } from '../../../../controllers';
import { videoSessionCommentMiddleware } from '../../../../middleware';

const commentRouter = Router({
  mergeParams: true,
});

commentRouter
  .route('/')
  .get(
    validate(videoSessionCommentValidationSchema.getVideoSessionComments),
    videoSessionCommentController.getComments
  )
  .post(
    validate(videoSessionCommentValidationSchema.createVideoSessionComment),
    videoSessionMiddleware.checkCommentEnabledOrForbidden,
    videoSessionCommentController.createComment
  );

commentRouter
  .route('/:comment_id')
  .get(
    validate(videoSessionCommentValidationSchema.getVideoSessionComment),
    videoSessionCommentMiddleware.attachCommentOrNotfound,
    videoSessionCommentController.getComment
  )
  .delete(
    validate(videoSessionCommentValidationSchema.deleteVideoSessionComment),
    videoSessionCommentMiddleware.attachCommentOrNotfound,
    videoSessionCommentMiddleware.checkOwnerOrForbidden,
    videoSessionCommentController.deleteComment
  );

export default commentRouter;
