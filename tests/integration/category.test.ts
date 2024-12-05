import prismaClient from '../../src/database/clients/prisma';
jest.unmock('../../src/database/clients/prisma.ts');
import testUserData from '../data/user.json';
import testCategoryData from '../data/category.json';
import redisClient from '../../src/database/clients/redis';
import express from 'express';
import session from 'express-session';
import sessionConfig from '../../src/config/session.config';
import app from '../../src/app';
import request from 'supertest';

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

describe('Category API', () => {
  beforeAll(async () => {
    for (const user of testUserData.users) {
      await prismaClient.user.create({
        data: { ...user, pfp: { create: {} } },
      });
    }

    for (const category of testCategoryData.categories) {
      await prismaClient.category.create({
        data: category,
      });
    }
    await redisClient.connect();
  });

  afterAll(async () => {
    await prismaClient.user.deleteMany({});
    await prismaClient.category.deleteMany({});
    await redisClient.disconnect();
  });

  describe('GET /categories', () => {
    test('Response_200_With_Single_Following', async () => {
      const res = await request(mockApp).get(`/categories`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(testCategoryData.categories.length);
    });
  });
});
