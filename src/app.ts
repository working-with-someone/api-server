import express from 'express';
import session from 'express-session';
import errorHandler from './middleware/errorHandler.middleware';
import NotFound from './middleware/notFound.middleware';
import requestLogger from './middleware/requestLogger.middleware';
import responseLogger from './middleware/responseLogger.middleware';
import router from './routes';
import authMiddleware from './middleware/auth.middleware';
import helmet from 'helmet';
import cors from 'cors';
import sessionConfig from './config/session.config';
import correlator from 'express-correlation-id';

const app = express();

// app.use(correlator());
//set security headers of response
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'same-site' },
  })
);

app.use(
  cors({
    origin: process.env.CORS_ALLOWED_ORIGIN?.split(' '),
    credentials: true,
  })
);

app.use(session(sessionConfig));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// log request
app.use(requestLogger);
app.use(responseLogger);

//jwt authentication
app.use(authMiddleware);

//api v1 routes
app.use(router);

//response 404 error for unknown api request
app.use('*', NotFound);

//error handler
app.use(errorHandler);

export default app;
