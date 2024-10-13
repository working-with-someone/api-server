import { Router } from 'express';
import { mediaController } from '../controllers';
import { mediaValidation } from '../validations';
import validate from '../middleware/validate';

const router = Router();

router
  .route('/images/:key')
  .get(validate(mediaValidation.getImage), mediaController.getImage);

router
  .route('/images/default/:key')
  .get(
    validate(mediaValidation.getDefaultImage),
    mediaController.getDefaultImage
  );

export default router;
