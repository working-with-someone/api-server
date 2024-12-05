import { Router } from 'express';
import { categoryController } from '../controllers';
import { categoryValidationSchema } from '../validations';
import validate from '../middleware/validate';

const router = Router();

// /categories
router
  .route('/')
  // upload된 image를 가져온다.
  .get(
    validate(categoryValidationSchema.getCategories),
    categoryController.getCategories
  );

export default router;
