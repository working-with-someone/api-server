import { Router } from 'express';
import validate from '../../../../middleware/validate.middleware';
import { userVideoSessionValidationSchema } from '../../../../validations';
import { userVideoSessionController } from '../../../../controllers';

const userVideoSessionRouter = Router({
    mergeParams: true,
});

userVideoSessionRouter
    .route('/')
    .get(
        validate(userVideoSessionValidationSchema.getUserVideoSessions),
        userVideoSessionController.getUserVideoSessions
    );

userVideoSessionRouter.route('/:video_session_id')
    .get(
        validate(userVideoSessionValidationSchema.getUserVideoSession),
        userVideoSessionController.getUserVideoSession
    );

export default userVideoSessionRouter;
