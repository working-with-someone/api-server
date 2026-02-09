import { Router } from 'express';
import liveSessionRouter from './live/live-session.route';
import videoSessionRouter from './video/video-session.route';

const router = Router();

router.use('/live', liveSessionRouter);
router.use('/video', videoSessionRouter);

export default router;
