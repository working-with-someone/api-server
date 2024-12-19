import prismaClient from '../../src/database/clients/prisma';
jest.unmock('../../src/database/clients/prisma.ts');
import testUserData from '../data/user.json';
import request from 'supertest';
import server from '../../src';

describe('Category API', () => {
  beforeAll(async () => {
    for (const user of testUserData.users) {
      await prismaClient.user.create({
        data: { ...user, pfp: { create: {} } },
      });
    }
  });

  afterAll(async () => {
    await prismaClient.user.deleteMany({});
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /categories', () => {
    test('Response_200_With_Single_Following', async () => {
      const res = await request(server).get(`/categories`);

      expect(res.statusCode).toEqual(200);
    });
  });
});
