import prismaClient from '../../src/database/clients/prisma';
jest.unmock('../../src/database/clients/prisma.ts');
import testUserData from '../data/user.json';
import testCategoryData from '../data/category.json';
import redisClient from '../../src/database/clients/redis';
import request from 'supertest';
import app from '../../src/app';

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
      const res = await request(app).get(`/categories`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(testCategoryData.categories.length);
    });
  });
});
