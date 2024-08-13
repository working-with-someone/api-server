import prismaClient from '../../src/database/clients/prisma';
import testUserData from '../data/user.json';
import redisClient from '../../src/database/clients/redis';
import cookie from 'cookie';
import { sessionIdName } from '../../src/config/session.config';

describe('User API', () => {
  const currUser: Record<string, any> = testUserData.users[0];
  currUser.sidCookie = cookie.serialize(
    sessionIdName,
    's:swUe4NER4JK-dXjjJ6BBh9ror_fVThwL.DdAmHH/rbIlEXTUYisnFX0mPit8jB9AtOyAXjmtO7jo'
  );

  beforeAll(async () => {
    testUserData.users.forEach(async (user) => {
      await prismaClient.user.create({
        data: user,
      });
    });

    await redisClient.connect();

    await redisClient.set(
      'sess:swUe4NER4JK-dXjjJ6BBh9ror_fVThwL',
      '{"cookie":{"originalMaxAge":null,"expires":null,"secure":false,"httpOnly":true, "path":"/"},"userId":1}'
    );
  });

  afterAll(async () => {
    await prismaClient.user.deleteMany({});
    await redisClient.disconnect();
  });
});
