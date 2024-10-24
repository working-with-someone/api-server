import { Router } from 'express';
import { mediaController } from '../controllers';
import { mediaValidationSchema } from '../validations';
import validate from '../middleware/validate';

const router = Router();

// /media/images/:key
router
  .route('/images/:key')
  // upload된 image를 가져온다.
  .get(validate(mediaValidationSchema.getImage), mediaController.getImage);

// /media/images/default/:key
router
  .route('/images/default/:key')
  // default image를 가져온다.
  .get(
    validate(mediaValidationSchema.getDefaultImage),
    mediaController.getDefaultImage
  );

export default router;
