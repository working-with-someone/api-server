import * as userValidationSchema from './user/index.validation';
import * as mediaValidationSchema from './media.validation';
import * as followValidationSchema from './follow.validation';
import * as categoryValidationSchema from './category.validation';
import * as preferredCategoryValidationSchema from './preferred_category.validation';
import * as liveSessionValidationSchema from './session/live/live-session.validation';
import * as videoSessionValidationSchema from './session/video/video-session.validation';
import * as breakTimeValidationSchema from './break-time.validation';
import * as videoSessionCommentValidationSchema from './session/video/comment/index.validation';
import * as userVideoSessionValidationSchema from './user/sessions/video/index.validation';

export {
  userValidationSchema,
  mediaValidationSchema,
  followValidationSchema,
  categoryValidationSchema,
  preferredCategoryValidationSchema,
  liveSessionValidationSchema,
  videoSessionValidationSchema,
  breakTimeValidationSchema,
  videoSessionCommentValidationSchema,
  userVideoSessionValidationSchema
};
