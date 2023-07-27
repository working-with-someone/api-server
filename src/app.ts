import express from 'express';
import errorHandler from './middleware/errorHandler';
import NotFound from './middleware/notFound';
import RequestLogger from './middleware/requestLogger';
import router from './routes/v1';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './middleware/auth';
import helmet from 'helmet';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));

app.use(express.json());

app.use(cookieParser());

app.use(RequestLogger);

app.use('/v1', authMiddleware);

app.use('/v1', router);

app.use('*', NotFound);

//error handler
app.use(errorHandler);

export default app;
