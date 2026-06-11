import { Router } from 'express';
import validate from '../../../middleware/validate.middleware';
import { commentValidationSchema } from '../../../validations';
import videoSessionMiddleware from '../../../middleware/session/video/video-session.middleware';
import { commentController } from '../../../controllers';

const commentRouter = Router({
  mergeParams: true,
});

commentRouter
  .route('/')
  .get(
    validate(commentValidationSchema.getVideoSessionComments),
    videoSessionMiddleware.attachVideoSessionOrNotfound,
    commentController.getComments
  )
  .post(
    validate(commentValidationSchema.createVideoSessionComment),
    videoSessionMiddleware.attachVideoSessionOrNotfound,
    videoSessionMiddleware.checkCommentEnabledOrForbidden,
    commentController.createComment
  );

commentRouter
  .route('/:comment_id')
  .get(
    validate(commentValidationSchema.getVideoSessionComment),
    videoSessionMiddleware.attachVideoSessionOrNotfound,
    commentController.getComment
  );

export default commentRouter;
