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

  describe('GET /users/:user_id/followings', () => {
    beforeAll(async () => {
      await prismaClient.follow.createMany({
        data: [
          {
            follower_user_id: currUser.id,
            following_user_id: testUserData.users[1].id,
          },
          {
            follower_user_id: currUser.id,
            following_user_id: testUserData.users[2].id,
          },
        ],
      });
    });

    afterAll(async () => {
      await prismaClient.follow.deleteMany({});
    });

    test('Response_200_With_Followings', async () => {
      const res = await request(mockApp).get(
        `/users/${currUser.id}/followings`
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
    });

    test('Response_200_With_Other_Users_Followings', async () => {
      const res = await request(mockApp).get(
        `/users/${testUserData.users[1].id}/followings`
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('POST /users/:user_id/followings/:following_user_id', () => {
    afterEach(async () => {
      await prismaClient.follow.deleteMany({});
    });

    const following = testUserData.users[1];

    test('Response_200_With_Following', async () => {
      const res = await request(mockApp).post(
        `/users/${currUser.id}/followings/${following.id}`
      );

      expect(res.statusCode).toEqual(201);
      expect(res.body.follower_user_id).toEqual(currUser.id);
      expect(res.body.following_user_id).toEqual(following.id);
    });

    test('Response_404', async () => {
      const res = await request(mockApp).post(
        `/users/${currUser.id}/followings/0`
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
        `/users/${currUser.id}/followings/${following.id}`
      );

      expect(res.statusCode).toEqual(409);
    });

    test('Response_401', async () => {
      const res = await request(mockApp).post(
        `/users/${following.id}/followings/${currUser.id}`
      );

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('DELETE /users/:user_id/followings/:following_user_id', () => {
    const following = testUserData.users[1];

    beforeEach(async () => {
      await prismaClient.follow.create({
        data: {
          following_user_id: following.id,
          follower_user_id: currUser.id,
        },
      });
    });

    afterEach(async () => [await prismaClient.follow.deleteMany()]);

    test('Response_204', async () => {
      const res = await request(mockApp).delete(
        `/users/${currUser.id}/followings/${following.id}`
      );

      expect(res.statusCode).toEqual(204);
    });

    test('Response_401', async () => {
      const res = await request(mockApp).delete(
        `/users/${following.id}/followings/${currUser.id}`
      );

      expect(res.statusCode).toEqual(401);
    });
  });

  describe('GET /users/:user_id/followers', () => {
    beforeAll(async () => {
      await prismaClient.follow.createMany({
        data: [
          {
            follower_user_id: testUserData.users[1].id,
            following_user_id: currUser.id,
          },
          {
            follower_user_id: testUserData.users[2].id,
            following_user_id: currUser.id,
          },
        ],
      });
    });

    afterAll(async () => {
      await prismaClient.follow.deleteMany({});
    });

    test('Response_200_With_Followers', async () => {
      const res = await request(mockApp).get(`/users/${currUser.id}/followers`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
    });

    test('Response_200_With_Other_Users', async () => {
      const res = await request(mockApp).get(
        `/users/${testUserData.users[1].id}/followers`
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(0);
    });
  });
});
