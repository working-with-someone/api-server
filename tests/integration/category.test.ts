import prismaClient from '../../src/database/clients/prisma';
jest.unmock('../../src/database/clients/prisma.ts');
import testUserData from '../data/user.json';
import testCategoryData from '../data/category.json';
import request from 'supertest';
import server from '../../src';

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
  });

  afterAll(async () => {
    await prismaClient.user.deleteMany({});
    await prismaClient.category.deleteMany({});
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /categories', () => {
    test('Response_200_With_Single_Following', async () => {
      const res = await request(server).get(`/categories`);

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(testCategoryData.categories.length);
    });
  });
});
