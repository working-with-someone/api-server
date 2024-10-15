import prismaClient from '../../src/database/clients/prisma';
jest.unmock('../../src/database/clients/prisma.ts');
import request from 'supertest';
import testUserData from '../data/user.json';
import app from '../../src/app';
import express from 'express';
import session from 'express-session';
import sessionConfig from '../../src/config/session.config';
import redisClient from '../../src/database/clients/redis';

const currUser = { ...testUserData.users[0] };

const mockApp = express();

// session object가 생성되도록한다.
mockApp.use(session(sessionConfig));

// 모든 request에 대해 session object에 userId property를 지정한다.
// authentication을 수행하는 auth middleware를 우회하기 위함이다.
mockApp.all('*', (req, res, next) => {
  req.session.userId = currUser.id;
  next();
});

mockApp.use(app);

describe('Follow API', () => {
  const currUser: Record<string, any> = { ...testUserData.users[0] };

  beforeAll(async () => {
    for (const user of testUserData.users) {
      await prismaClient.user.create({
        data: { ...user, pfp: { create: {} } },
      });
    }

    await redisClient.connect();
  });

  afterAll(async () => {
    await prismaClient.user.deleteMany({});
    await redisClient.disconnect();
  });

  describe('POST /users/:user_id/following/:following_user_id', () => {
    afterEach(async () => {
      await prismaClient.follow.deleteMany({});
    });

    const following = testUserData.users[1];

    test('Response_200_With_Following', async () => {
      const res = await request(mockApp).post(
        `/users/${currUser.id}/following/${following.id}`
      );

      expect(res.statusCode).toEqual(201);
      expect(res.body.follower_user_id).toEqual(currUser.id);
      expect(res.body.following_user_id).toEqual(following.id);
    });

    test('Response_404', async () => {
      const res = await request(mockApp).post(
        `/users/${currUser.id}/following/0`
      );

      expect(res.statusCode).toEqual(404);
    });

    test('Response_409', async () => {
      await prismaClient.follow.create({
        data: {
          follower_user_id: currUser.id,
          following_user_id: following.id,
        },
      });

      const res = await request(mockApp).post(
        `/users/${currUser.id}/following/${following.id}`
      );

      expect(res.statusCode).toEqual(409);
    });
  });

  describe('DELETE /users/:user_id/following/:following_user_id', () => {
    const following = testUserData.users[1];

    beforeEach(async () => {
      await prismaClient.follow.create({
        data: {
          following_user_id: following.id,
          follower_user_id: currUser.id,
        },
      });
    });

    test('Response_204', async () => {
      const res = await request(mockApp).delete(
        `/users/${currUser.id}/following/${following.id}`
      );

      expect(res.statusCode).toEqual(204);
    });
  });
});
