import express from 'express';
import errorHandler from './middleware/errorHandler';
import NotFound from './middleware/notFound';

const app = express();

app.use(express.json());

app.use('*', NotFound);

//error handler
app.use(errorHandler);

export default app;
