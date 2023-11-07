import express from 'express';
import errorHandler from './middleware/errorHandler';
import NotFound from './middleware/notFound';
import RequestLogger from './middleware/requestLogger';
import router from './routes/v1';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './middleware/auth';
import helmet from 'helmet';
import cors from 'cors';
const app = express();

//set security headers of response
app.use(helmet());

app.use(
  cors({
    origin: process.env.CORS_ALLOWED_ORIGIN?.split(' '),
  })
);

app.use(express.json());

//parse cookie from headers
app.use(cookieParser());

//log request
app.use(RequestLogger);

//jwt authentication
app.use('/v1', authMiddleware);

//api v1 routes
app.use('/v1', router);

//response 404 error for unknown api request
app.use('*', NotFound);

//error handler
app.use(errorHandler);

export default app;
