import prismaClient from '../../src/database/clients/prisma';
import testUserData from '../data/user.json';
import server from '../../src/server';

describe('User API', () => {
  beforeAll(async () => {
    testUserData.users.forEach(async (user) => {
      await prismaClient.user.create({
        data: user,
      });
    });
  });

  afterAll(async () => {
    await prismaClient.user.deleteMany({});

    server.close();
  });
});
