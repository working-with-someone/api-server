import { PrismaClient } from '@prisma/client';
import { databaseLogger } from '../logger/winston';
const prisma = new PrismaClient({
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'stdout',
      level: 'error',
    },
    {
      emit: 'stdout',
      level: 'warn',
    },
  ],
});

prisma.$on('query', (e) => {
  const message = `${e.query} / ${e.params} / ${e.duration}`;

  databaseLogger.log('info', message);
});

export default prisma;
