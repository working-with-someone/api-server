import winston, { LoggerOptions } from 'winston';
import path from 'path';

const httpFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} ${level.toUpperCase()} ${message}`;
  })
);

const webServerLoggerConfig: LoggerOptions = {
  defaultMeta: { timestamp: true },
  format: httpFormat,
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'log/webserver.log'),
    }),
  ],
};

const sysErrorLoggerConfig: LoggerOptions = {
  defaultMeta: { timestamp: true },
  format: winston.format.combine(
    httpFormat,
    winston.format.metadata({ fillExcept: ['timestamp', 'level', 'message'] }),
    winston.format.printf(({ timestamp, level, message, metadata }) => {
      let logMessage = `${timestamp} ${level.toUpperCase()} ${message}`;
      if (metadata) {
        logMessage += ` ${JSON.stringify(metadata)}`;
      }
      return logMessage;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'log/sys-error.log'),
    }),
  ],
};

const databaseLoggerConfig: LoggerOptions = {
  defaultMeta: { timestamp: true },
  format: winston.format.combine(
    httpFormat,
    winston.format.metadata({ fillExcept: ['timestamp', 'level', 'message'] }),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} ${level.toUpperCase()} ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({
      filename: path.join(process.cwd(), 'log/database.log'),
    }),
  ],
};

export { webServerLoggerConfig, sysErrorLoggerConfig, databaseLoggerConfig };
