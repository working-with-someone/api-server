import { Router } from 'express';
import { userController } from '../../controllers';
import { userValidationSchema } from '../../validations';
import validate from '../../middleware/validate';
import multer from 'multer';
import { followingRouter, followerRouter } from './follow.route';
import userEndpointMiddleware from '../../middleware/user';

const router = Router();

// /users/self
router
  .route('/self')
  // authenticated user의 private한 정보를 가져온다.
  .get(userController.getSelf);

// /users/:user_id
router
  .route('/:user_id')
  // 사용자의 정보를 가져온다 self라면 /self와 동일한 응답, 아니라면 public한 정보만을 응답한다.
  .get(validate(userValidationSchema.getUser), userController.getUser)
  // 사용자의 정보를 업데이트한다.
  .put(
    multer().single('pfp'),
    validate(userValidationSchema.updateUser),
    userEndpointMiddleware.attachUserOrNotfound,
    userEndpointMiddleware.checkIsOwnerOrForbidden,
    userController.updateUser
  );

// /users/:user_id/followings
router.use('/:user_id/followings', followingRouter);
// /users/:user_id/followers
router.use('/:user_id/followers', followerRouter);

export default router;
