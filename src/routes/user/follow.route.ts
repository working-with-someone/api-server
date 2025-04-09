import { Router } from 'express';
import { followValidationSchema } from '../../validations';
import { followController } from '../../controllers';
import validate from '../../middleware/validate.middleware';
import userEndpointMiddleware from '../../middleware/user/user.middleware';
import followEndpointMiddleware from '../../middleware/following/following.middleware';

const followingRouter = Router({
  mergeParams: true,
});

const followerRouter = Router({
  mergeParams: true,
});

// /users/:user_id/followings
followingRouter
  .route('/')
  // 사용자가 following하는 사용자들을 가져온다.
  .get(
    validate(followValidationSchema.getFollowings),
    userEndpointMiddleware.attachUserOrNotfound,
    followController.getFollowings
  );

// /users/:user_id/followings/:following_user_id
followingRouter
  .route('/:following_user_id')
  .get(
    validate(followValidationSchema.checkFollowing),
    userEndpointMiddleware.attachUserOrNotfound,
    followEndpointMiddleware.attachFollowingOrNotFound,
    followController.getFollowing
  )
  // 사용자의 다른 사용자 following을 생성한다.
  .post(
    validate(followValidationSchema.createFollowing),
    userEndpointMiddleware.attachUserOrNotfound,
    userEndpointMiddleware.checkIsOwnerOrForbidden,
    followEndpointMiddleware.checkFollowingDoesNotExistOrConflict,
    followEndpointMiddleware.checkTargetUserExistOrNotFound,
    followController.createFollowing
  )
  // 사용자의 다른 사용자 following을 제거한다.
  .delete(
    validate(followValidationSchema.deleteFollowing),
    userEndpointMiddleware.attachUserOrNotfound,
    userEndpointMiddleware.checkIsOwnerOrForbidden,
    followEndpointMiddleware.attachFollowingOrNotFound,
    followController.deleteFollowing
  );

// /users/:user_id/followers
followerRouter
  .route('/')
  // 사용자를 following하는 사용자들을 가져온다.
  .get(
    validate(followValidationSchema.getFollowers),
    userEndpointMiddleware.attachUserOrNotfound,
    followController.getFollowers
  );

export { followingRouter, followerRouter };
