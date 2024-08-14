import prismaClient from '../../src/database/clients/prisma';
jest.unmock('../../src/database/clients/prisma.ts');

import testUserData from '../data/user.json';
import redisClient from '../../src/database/clients/redis';
import cookie from 'cookie';
import { sessionIdName } from '../../src/config/session.config';
import request from 'supertest';
import app from '../../src/app';
import { getPublicUserInfo } from '../../src/services/user.service';

describe('User API', () => {
  const currUser: Record<string, any> = { ...testUserData.users[0] };
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
  describe('GET v1/users/:userId', () => {
    test('Response_200_With_Public_Current_User_Info', async () => {
      const res = await request(app)
        .get(`/v1/users/${currUser.id}`)
        .set('Cookie', currUser.sidCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toEqual(getPublicUserInfo(currUser));
    });

    test('Response_200_With_Public_User_Info', async () => {
      const user = testUserData.users[1];

      const res = await request(app)
        .get(`/v1/users/${user.id}`)
        .set('Cookie', currUser.sidCookie);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toEqual(getPublicUserInfo(user));
    });

    test('Response_404', async () => {
      const res = await request(app)
        .get(`/v1/users/${testUserData.notFoundUserId}`)
        .set('Cookie', currUser.sidCookie);

      expect(res.statusCode).toEqual(404);
    });

    test('Response_400_userId(?)', async () => {
      const res = await request(app)
        // string userId is invalid, userId must be number
        .get(`/v1/users/${testUserData.invalidUserId}`)
        .set('Cookie', currUser.sidCookie);

      expect(res.statusCode).toEqual(400);
    });
  });
});
