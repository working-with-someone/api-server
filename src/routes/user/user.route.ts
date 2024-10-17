import { Router } from 'express';
import { userController } from '../../controllers';
import { userValidationSchema } from '../../validations';
import validate from '../../middleware/validate';
import multer from 'multer';
import { followingRouter, followerRouter } from './follow.route';
import { userPermission } from '../../middleware/permission';

const router = Router();

router.route('/self').get(userController.getSelf);

router
  .route('/:userId')
  .get(validate(userValidationSchema.getUser), userController.getUser)
  .put(
    multer().single('pfp'),
    validate(userValidationSchema.updateUser),
    userPermission(),
    userController.updateSelf
  );

router.use('/:userId/followings', followingRouter);
router.use('/:userId/followers', followerRouter);

export default router;
