import prismaClient from '../../src/database/clients/prisma';
jest.unmock('../../src/database/clients/prisma.ts');

import testUserData from '../data/user.json';
import redisClient from '../../src/database/clients/redis';
import app from '../../src/app';
import { getPublicUserInfo } from '../../src/services/user.service';
import express from 'express';
import request from 'supertest';
import session from 'express-session';
import sessionConfig from '../../src/config/session.config';

const currUser = testUserData.users[0];

const mockApp = express();

mockApp.use(session(sessionConfig));

mockApp.all('*', (req, res, next) => {
  req.session.userId = currUser.id;
  next();
});

mockApp.use(app);

describe('User API', () => {
  const currUser: Record<string, any> = { ...testUserData.users[0] };

  beforeAll(async () => {
    testUserData.users.forEach(async (user) => {
      await prismaClient.user.create({
        data: user,
      });
    });

    await redisClient.connect();
  });

  afterAll(async () => {
    await prismaClient.user.deleteMany({});
    await redisClient.disconnect();
  });
  describe('GET v1/users/:userId', () => {
    test('Response_200_With_Public_Current_User_Info', async () => {
      const res = await request(mockApp).get(`/v1/users/${currUser.id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toEqual(getPublicUserInfo(currUser));
    });

    test('Response_200_With_Public_User_Info', async () => {
      const user = testUserData.users[1];

      const res = await request(mockApp).get(`/v1/users/${user.id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toEqual(getPublicUserInfo(user));
    });

    test('Response_404', async () => {
      const res = await request(mockApp).get(
        `/v1/users/${testUserData.notFoundUserId}`
      );

      expect(res.statusCode).toEqual(404);
    });

    test('Response_400_userId(?)', async () => {
      const res = await request(mockApp)
        // string userId is invalid, userId must be number
        .get(`/v1/users/${testUserData.invalidUserId}`);

      expect(res.statusCode).toEqual(400);
    });
  });
});
