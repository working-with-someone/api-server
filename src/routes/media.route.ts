import { Router } from 'express';
import { mediaController } from '../controllers';
import { mediaValidationSchema } from '../validations';
import validate from '../middleware/validate';

const router = Router();

router
  .route('/images/:key')
  .get(validate(mediaValidationSchema.getImage), mediaController.getImage);

router
  .route('/images/default/:key')
  .get(
    validate(mediaValidationSchema.getDefaultImage),
    mediaController.getDefaultImage
  );

export default router;
