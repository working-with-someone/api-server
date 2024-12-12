import winston from 'winston';
import {
  httpLoggerConfig,
  errorLoggerConfig,
  databaseLoggerConfig,
} from '../config/winston.config';

const httpLogger = winston.createLogger(httpLoggerConfig);

const errorLogger = winston.createLogger(errorLoggerConfig);

const databaseLogger = winston.createLogger(databaseLoggerConfig);

export { httpLogger, errorLogger, databaseLogger };
