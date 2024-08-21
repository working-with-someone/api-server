import { Router } from 'express';
import { userController } from '../../controllers';
import userValidation from '../../validations/user.validation';
import validate from '../../middleware/validate';
const router = Router();

router.route('/self').get(userController.getSelf);

router
  .route('/:userId')
  .get(validate(userValidation.getUser), userController.getUser);

export default router;
