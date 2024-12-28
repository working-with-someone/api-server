import { Router } from 'express';
import liveSessionRouter from './live.route';

const router = Router();

router.use('/live', liveSessionRouter);

export default router;
