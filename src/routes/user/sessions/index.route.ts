import { Router } from 'express';
import userVideoSessionRouter from './video/index.route'

const userSessionsRouter = Router({
    mergeParams: true,
});

userSessionsRouter.use('/video', userVideoSessionRouter);

export default userSessionsRouter;