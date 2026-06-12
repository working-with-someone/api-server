import { Router } from 'express';
import validate from '../../../middleware/validate.middleware';
import { commentValidationSchema } from '../../../validations';
import videoSessionMiddleware from '../../../middleware/session/video/video-session.middleware';
import { commentController } from '../../../controllers';
import commentMiddleware from '../../../middleware/session/video/comment.middleware';

const commentRouter = Router({
  mergeParams: true,
});

commentRouter
  .route('/')
  .get(
    validate(commentValidationSchema.getVideoSessionComments),
    commentController.getComments
  )
  .post(
    validate(commentValidationSchema.createVideoSessionComment),
    videoSessionMiddleware.checkCommentEnabledOrForbidden,
    commentController.createComment
  );

commentRouter
  .route('/:comment_id')
  .get(
    validate(commentValidationSchema.getVideoSessionComment),
    commentMiddleware.attachCommentOrNotfound,
    commentController.getComment
  )
  .delete(
    validate(commentValidationSchema.deleteVideoSessionComment),
    commentMiddleware.attachCommentOrNotfound,
    commentMiddleware.checkOwnerOrForbidden,
    commentController.deleteComment
  );

export default commentRouter;
