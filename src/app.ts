import express from 'express';
import errorHandler from './middleware/errorHandler';

const app = express();

app.use(express.json());

//error handler
app.use(errorHandler);

export default app;
