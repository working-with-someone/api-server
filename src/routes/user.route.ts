import { Router } from 'express';
import { userController } from '../controllers';
import userValidation from '../validations/user.validation';
import validate from '../middleware/validate';
import upload from 'express-fileupload';

const router = Router();

router
  .route('/self')
  .get(userController.getSelf)
  .put(
    upload({ limits: { files: 1 } }),
    validate(userValidation.updateSelf),
    userController.updateSelf
  );

router
  .route('/:userId')
  .get(validate(userValidation.getUser), userController.getUser);

export default router;
