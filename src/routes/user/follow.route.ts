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

// /users/:userId/followings
followingRouter
  .route('/')
  // 사용자가 following하는 사용자들을 가져온다.
  .get(
    validate(followValidationSchema.getFollowings),
    followController.getFollowings
  );

// /users/:userId/followings/:following_user_id
followingRouter
  .route('/:following_user_id')
  .get(
    validate(followValidationSchema.checkFollowing),
    followController.checkFollowing
  )
  // 사용자의 다른 사용자 following을 생성한다.
  .post(
    validate(followValidationSchema.createFollowing),
    userPermission(),
    followController.createFollowing
  )
  // 사용자의 다른 사용자 following을 제거한다.
  .delete(
    validate(followValidationSchema.deleteFollowing),
    userPermission(),
    followController.deleteFollowing
  );

// /users/:userId/followers
followerRouter
  .route('/')
  // 사용자를 following하는 사용자들을 가져온다.
  .get(
    validate(followValidationSchema.getFollowers),
    followController.getFollowers
  );

export { followingRouter, followerRouter };
