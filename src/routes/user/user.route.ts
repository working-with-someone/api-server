import { Router } from 'express';
import { userController } from '../../controllers';
import { userValidationSchema } from '../../validations';
import validate from '../../middleware/validate';
import upload from 'express-fileupload';
import { followingRouter, followerRouter } from './follow.route';
import { userPermission } from '../../middleware/permission';

const router = Router();

router.route('/self').get(userController.getSelf);

router
  .route('/:userId')
  .get(validate(userValidationSchema.getUser), userController.getUser)
  .put(
    upload({ limits: { files: 1 } }),
    validate(userValidationSchema.updateUser),
    userPermission(),
    userController.updateSelf
  );

router.use('/:userId/followings', followingRouter);
router.use('/:userId/followers', followerRouter);

export default router;
