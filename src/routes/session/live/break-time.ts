import { Router } from 'express';
import validate from '../../../middleware/validate';
import { breakTimeValidationSchema } from '../../../validations';

import liveSessionMiddleware from '../../../middleware/session/live';
import breakTimeController from '../../../controllers/session/live/break-time.controller';

const breakTimeRouter = Router({
  mergeParams: true,
});

breakTimeRouter
  .route('/')
  .post(
    validate(breakTimeValidationSchema.createBreakTime),
    liveSessionMiddleware.attachLiveSessionOrNotfound,
    liveSessionMiddleware.checkOwnerOrForbidden,
    breakTimeController.createBreakTime
  );

export default breakTimeRouter;
