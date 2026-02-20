import { Router } from 'express';
import { preferredCategoryValidationSchema } from '../../validations';
import { preferredCategoryController } from '../../controllers';
import validate from '../../middleware/validate.middleware';
import userEndpointMiddleware from '../../middleware/user/user.middleware';
import categoryEndpointMiddleware from '../../middleware/category/category.middleware';

const preferredRouter = Router({
  mergeParams: true,
});

// /users/:user_id/preferred-category
preferredRouter
  .route('/')
  .get(
    validate(preferredCategoryValidationSchema.getPreferredCategories),
    userEndpointMiddleware.attachUserOrNotfound,
    preferredCategoryController.getPreferredCategories
  );

// /users/:user_id/preferred-category/:category_label
preferredRouter
  .route('/:category_label')
  .post(
    validate(preferredCategoryValidationSchema.createPreferredCategory),
    userEndpointMiddleware.attachUserOrNotfound,
    userEndpointMiddleware.checkIsOwnerOrForbidden,
    categoryEndpointMiddleware.checkCategoryExistOrNotFound,
    preferredCategoryController.createPreferredCategory
  )
  .delete(
    validate(preferredCategoryValidationSchema.deletePreferredCategory),
    userEndpointMiddleware.attachUserOrNotfound,
    userEndpointMiddleware.checkIsOwnerOrForbidden,
    categoryEndpointMiddleware.checkCategoryExistOrNotFound,
    preferredCategoryController.deletePreferredCategory
  );

// update priority
preferredRouter
  .route('/:category_label/priority/:priority')
  .put(
    validate(preferredCategoryValidationSchema.updatePreferredCategoryPriority),
    userEndpointMiddleware.attachUserOrNotfound,
    userEndpointMiddleware.checkIsOwnerOrForbidden,
    categoryEndpointMiddleware.checkCategoryExistOrNotFound,
    preferredCategoryController.updatePreferredCategoryPriority
  );

export default preferredRouter;
