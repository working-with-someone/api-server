import winston, { LoggerOptions } from 'winston';
import path from 'path';

const logFileRoot = path.join(
  process.cwd(),
  process.env.NODE_ENV == 'test' ? 'log/test' : 'log'
);

const httpFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `${timestamp} ${level.toUpperCase()} ${message}`;
  })
);

const generateTransports = (logFileName: string) => {
  const transports: winston.transport[] = [
    new winston.transports.File({
      filename: `${logFileRoot}/${logFileName}`,
    }),
  ];

  // development mode에서 log file에 기록될 log를 console에도 출력한다.
  if (process.env.NODE_ENV === 'development') {
    transports.push(new winston.transports.Console());
  }

  return transports;
};

const webServerLoggerConfig: LoggerOptions = {
  defaultMeta: { timestamp: true },
  format: httpFormat,
  transports: generateTransports('webserver.log'),
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
  transports: generateTransports('sys-error.log'),
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
  transports: generateTransports('database.log'),
};

export { webServerLoggerConfig, sysErrorLoggerConfig, databaseLoggerConfig };
