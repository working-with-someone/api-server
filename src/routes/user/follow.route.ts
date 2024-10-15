import { Router } from 'express';
import followValidation from '../../validations/follow.validation';
import { followController } from '../../controllers';
import validate from '../../middleware/validate';

const followingRouter = Router();

followingRouter
  .route('/:following_user_id')
  .post(validate(followValidation.createFollow), followController.createFollow)
  .delete(
    validate(followValidation.deleteFollow),
    followController.deleteFollow
  );

export default followingRouter;
