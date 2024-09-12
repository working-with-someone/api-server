import express from 'express';
import session from 'express-session';
import errorHandler from './middleware/errorHandler';
import NotFound from './middleware/notFound';
import RequestLogger from './middleware/requestLogger';
import router from './routes';
import cookieParser from 'cookie-parser';
import { authMiddleware } from './middleware/auth';
import helmet from 'helmet';
import cors from 'cors';
import sessionConfig from './config/session.config';

const app = express();

//set security headers of response
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);

app.use(
  cors({
    origin: process.env.CORS_ALLOWED_ORIGIN?.split(' '),
  })
);

app.use(session(sessionConfig));

app.use(express.json());

//log request
app.use(RequestLogger);

//jwt authentication
app.use(authMiddleware);

//api v1 routes
app.use(router);

//response 404 error for unknown api request
app.use('*', NotFound);

//error handler
app.use(errorHandler);

export default app;
