import { Router } from 'express';
import { userController } from '../../controllers';

const router = Router();

router
  .route('/:userId')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

export default router;
