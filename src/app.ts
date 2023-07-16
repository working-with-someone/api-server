import express from 'express';
import errorHandler from './middleware/errorHandler';
import NotFound from './middleware/notFound';
import RequestLogger from './middleware/requestLogger';

const app = express();

app.use(express.json());

app.use(RequestLogger);

app.use('*', NotFound);

//error handler
app.use(errorHandler);

export default app;
