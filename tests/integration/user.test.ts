import prismaClient from '../../src/database/clients/prisma';
import testUserData from '../data/user.json';
import redisClient from '../../src/database/clients/redis';
import request from 'supertest';
import app from '../../src/app';
import cookie from 'cookie';
import { sessionIdName } from '../../src/config/session.config';

jest.unmock('../../src/database/clients/prisma');

describe('User API', () => {
  const currUser: Record<string, any> = {
    ...testUserData.users[0],
  };

  currUser.sidCookie = cookie.serialize(
    sessionIdName,
    's:swUe4NER4JK-dXjjJ6BBh9ror_fVThwL.DdAmHH/rbIlEXTUYisnFX0mPit8jB9AtOyAXjmtO7jo'
  );

  beforeAll(async () => {
    for (const user of testUserData.users) {
      await prismaClient.user.create({
        data: user,
      });
    }

    await redisClient.connect();

    await redisClient.set(
      'sess:swUe4NER4JK-dXjjJ6BBh9ror_fVThwL',
      `{"cookie":{"originalMaxAge":null,"expires":null,"secure":false,"httpOnly":true, "path":"/"},"userId":${currUser.id}}`
    );
  });

  afterAll(async () => {
    await prismaClient.user.deleteMany({});
    await redisClient.disconnect();
  });

  test('Response_Clients_With_200', (done) => {
    request(app)
      .get(`/v1/users/${currUser.id}`)
      .set('Cookie', currUser.sidCookie)
      .expect(200)
      .end(done);
  });
});
