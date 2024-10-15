import { Router } from 'express';
import { userController } from '../../controllers';
import userValidation from '../../validations/user.validation';
import validate from '../../middleware/validate';
import upload from 'express-fileupload';
import { followingRouter, followerRouter } from './follow.route';
import { userPermission } from '../../middleware/permission';

const router = Router();

router.route('/self').get(userController.getSelf);

router
  .route('/:userId')
  .get(validate(userValidation.getUser), userController.getUser)
  .put(
    upload({ limits: { files: 1 } }),
    validate(userValidation.updateUser),
    userPermission(),
    userController.updateSelf
  );

router.use('/:userId/followings', followingRouter);
router.use('/:userId/followers', followerRouter);

export default router;
