import { Router } from 'express';
import followValidation from '../validations/follow.validation';
import { followController } from '../controllers';
import validate from '../middleware/validate';

const router = Router();

router
  .route('/:following_user_id')
  .post(validate(followValidation.createFollow), followController.createFollow);

export default router;
