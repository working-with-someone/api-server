import { Router } from 'express';
import liveSessionRouter from './live';

const router = Router();

router.use('/live', liveSessionRouter);

export default router;
