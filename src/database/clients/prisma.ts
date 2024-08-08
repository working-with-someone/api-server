import { PrismaClient } from '@prisma/client';
import { databaseLogger } from '../../logger/winston';
const prismaClient = new PrismaClient({
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

prismaClient.$on('query', (e) => {
  const message = `${e.query} / ${e.params} / ${e.duration}`;

  databaseLogger.log('info', message);
});

export default prismaClient;
