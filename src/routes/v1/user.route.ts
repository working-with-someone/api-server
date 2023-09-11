import { Router } from 'express';
import { userController } from '../../controllers';
import userValidation from '../../validations/user.validation';
import validate from '../../middleware/validate';
const router = Router();

router
  .route('/:userId')
  .get(validate(userValidation.getUser), userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
