import winston from 'winston';
import {
  webServerLoggerConfig,
  sysErrorLoggerConfig,
  databaseLoggerConfig,
} from '../config/winston.config';

const webServerLogger = winston.createLogger(webServerLoggerConfig);

const sysErrorLogger = winston.createLogger(sysErrorLoggerConfig);

const databaseLogger = winston.createLogger(databaseLoggerConfig);

export { webServerLogger, sysErrorLogger, databaseLogger };
