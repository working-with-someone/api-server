import * as userController from './user.controller';
import * as mediaController from './media.controller';
import * as followController from './follow.controller';
import * as categoryController from './category.controller';
import * as preferredCategoryController from './preferred_category.controller';
import * as liveSessionController from './session/live/live-session.controller';
import * as videoSessionController from './session/video/video-session.controller';
import * as videoSessionCommentController from './session/video/comment/index.controller';
import * as videoSessionCommentLikeController from './session/video/comment/like.controller';

export {
  userController,
  mediaController,
  followController,
  categoryController,
  preferredCategoryController,
  liveSessionController,
  videoSessionController,
  videoSessionCommentController,
  videoSessionCommentLikeController,
};
