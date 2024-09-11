import { Router } from 'express';
import { mediaController } from '../controllers';
import { mediaValidation } from '../validations';
import validate from '../middleware/validate';

const router = Router();

router
  .route('/images/:key')
  .get(validate(mediaValidation.getImage), mediaController.getImage);

export default router;
