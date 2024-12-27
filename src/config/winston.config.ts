import winston, { LoggerOptions } from 'winston';
import path from 'path';

const baseFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.json()
);

const httpLogFormat = winston.format.combine(baseFormat);
const errorLogFormat = winston.format.combine(baseFormat);
const databaseLogFormat = winston.format.combine(baseFormat);

const generateTransports = (logFileName: string) => {
  const logFileRoot = path.posix.join(
    process.cwd(),
    process.env.NODE_ENV == 'test' ? 'log/test' : 'log'
  );

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

const httpLoggerConfig: LoggerOptions = {
  format: httpLogFormat,
  transports: generateTransports('http.log'),
};

const errorLoggerConfig: LoggerOptions = {
  format: errorLogFormat,
  transports: generateTransports('error.log'),
};

const databaseLoggerConfig: LoggerOptions = {
  format: databaseLogFormat,
  transports: generateTransports('database.log'),
};

export { httpLoggerConfig, errorLoggerConfig, databaseLoggerConfig };
