import { PrismaClient } from '../../../prisma/generated/prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { databaseLogger } from '../../logger/winston';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is required to initialize PrismaClient.');
}

const adapter = new PrismaMariaDb(databaseUrl);

const prismaClient = new PrismaClient({
  adapter,
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
