import { Router } from 'express';
import followValidation from '../../validations/follow.validation';
import { followController } from '../../controllers';
import validate from '../../middleware/validate';
import { userPermission } from '../../middleware/permission';

const followingRouter = Router({
  mergeParams: true,
});

followingRouter
  .route('/')
  .get(
    validate(followValidation.getFollowings),
    followController.getFollowings
  );

followingRouter
  .route('/:following_user_id')
  .post(
    validate(followValidation.createFollow),
    userPermission(),
    followController.createFollow
  )
  .delete(
    validate(followValidation.deleteFollow),
    userPermission(),
    followController.deleteFollow
  );

export default followingRouter;
