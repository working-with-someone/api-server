import express from 'express';
import errorHandler from './middleware/errorHandler';
import NotFound from './middleware/notFound';
import RequestLogger from './middleware/requestLogger';
import router from './routes/v1';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './middleware/auth';

const app = express();

app.use(express.json());

app.use(cookieParser());

app.use(RequestLogger);

app.use(authMiddleware);

app.use('/v1', router);

app.use('*', NotFound);

//error handler
app.use(errorHandler);

export default app;
