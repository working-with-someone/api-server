import { Router } from 'express';
import validate from '../../../../middleware/validate.middleware';
import { videoSessionCommentValidationSchema } from '../../../../validations';
import videoSessionMiddleware from '../../../../middleware/session/video/video-session.middleware';
import { videoSessionCommentController } from '../../../../controllers';
import { videoSessionCommentMiddleware } from '../../../../middleware';
import videoSessionCommentLikeRouter from './like.route';

const videoSessionCommentRouter = Router({
  mergeParams: true,
});

videoSessionCommentRouter
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

videoSessionCommentRouter
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

videoSessionCommentRouter.use(
  '/:comment_id/like',
  videoSessionCommentMiddleware.attachCommentOrNotfound,
  videoSessionCommentLikeRouter
);

export default videoSessionCommentRouter;
