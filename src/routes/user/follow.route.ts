import { Router } from 'express';
import { followValidationSchema } from '../../validations';
import { followController } from '../../controllers';
import validate from '../../middleware/validate';
import { userPermission } from '../../middleware/permission';

const followingRouter = Router({
  mergeParams: true,
});

const followerRouter = Router({
  mergeParams: true,
});

followingRouter
  .route('/')
  .get(
    validate(followValidationSchema.getFollowings),
    followController.getFollowings
  );

followingRouter
  .route('/:following_user_id')
  .post(
    validate(followValidationSchema.createFollow),
    userPermission(),
    followController.createFollowings
  )
  .delete(
    validate(followValidationSchema.deleteFollow),
    userPermission(),
    followController.deleteFollowings
  );

followerRouter
  .route('/')
  .get(
    validate(followValidationSchema.getFollowers),
    followController.getFollowers
  );

export { followingRouter, followerRouter };
