import prismaClient from '../../src/database/clients/prisma';
jest.unmock('../../src/database/clients/prisma.ts');
import request from 'supertest';
import testUserData from '../data/user.json';
import server from '../../src';
import currUser from '../data/curr-user';

describe('Follow API', () => {
  beforeAll(async () => {
    await currUser.insert();

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

  describe('GET /users/:user_id/followings', () => {
    beforeAll(async () => {
      await prismaClient.follow.createMany({
        data: [
          {
            follower_user_id: currUser.id,
            following_user_id: testUserData.users[0].id,
          },
          {
            follower_user_id: currUser.id,
            following_user_id: testUserData.users[1].id,
          },
          {
            follower_user_id: testUserData.users[0].id,
            following_user_id: currUser.id,
          },
          {
            follower_user_id: testUserData.users[0].id,
            following_user_id: testUserData.users[1].id,
          },
          {
            follower_user_id: testUserData.users[1].id,
            following_user_id: currUser.id,
          },
          {
            follower_user_id: testUserData.users[1].id,
            following_user_id: testUserData.users[0].id,
          },
        ],
      });
    });

    afterAll(async () => {
      await prismaClient.follow.deleteMany({});
    });

    test('Response_200_With_Single_Following', async () => {
      const res = await request(server)
        .get(`/users/${currUser.id}/followings`)
        .query({
          per_page: 1,
          page: 1,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
    });

    test('Response_200_With_Multiple_Followings', async () => {
      const res = await request(server)
        .get(`/users/${currUser.id}/followings`)
        .query({
          per_page: 2,
          page: 1,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
    });

    test('Response_200_With_Other_Users_Single_Following', async () => {
      const res = await request(server)
        .get(`/users/${testUserData.users[0].id}/followings`)
        .query({
          per_page: 1,
          page: 2,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
    });

    test('Response_200_With_Other_Users_Multiple_Followings', async () => {
      const res = await request(server)
        .get(`/users/${testUserData.users[0].id}/followings`)
        .query({
          per_page: 2,
          page: 1,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
    });

    test('Response_404', async () => {
      const res = await request(server).get(`/users/-1/followings`).query({
        per_page: 1,
        page: 1,
      });

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('GET /users/:user_id/followings/:following_user_id', () => {
    beforeAll(async () => {
      await prismaClient.follow.createMany({
        data: [
          {
            follower_user_id: currUser.id,
            following_user_id: testUserData.users[0].id,
          },
          {
            follower_user_id: testUserData.users[0].id,
            following_user_id: currUser.id,
          },
          {
            follower_user_id: testUserData.users[0].id,
            following_user_id: testUserData.users[1].id,
          },
          {
            follower_user_id: testUserData.users[1].id,
            following_user_id: currUser.id,
          },
          {
            follower_user_id: testUserData.users[1].id,
            following_user_id: testUserData.users[0].id,
          },
        ],
      });
    });

    afterAll(async () => {
      await prismaClient.follow.deleteMany({});
    });

    test('Response_204', async () => {
      const res = await request(server).get(
        `/users/${currUser.id}/followings/${testUserData.users[0].id}`
      );

      expect(res.statusCode).toEqual(204);
    });

    test('Response_404', async () => {
      const res = await request(server).get(
        `/users/${currUser.id}/followings/${testUserData.users[1].id}`
      );

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('POST /users/:user_id/followings/:following_user_id', () => {
    afterEach(async () => {
      await prismaClient.follow.deleteMany({});
    });

    const following = testUserData.users[0];

    test('Response_200_With_Following', async () => {
      const res = await request(server).post(
        `/users/${currUser.id}/followings/${following.id}`
      );

      expect(res.statusCode).toEqual(201);
      expect(res.body.follower_user_id).toEqual(currUser.id);
      expect(res.body.following_user_id).toEqual(following.id);

      const followerUser = (await request(server).get(`/users/${currUser.id}`))
        .body;
      const followingUser = (
        await request(server).get(`/users/${following.id}`)
      ).body;

      expect(followerUser.followings_count).toEqual(1);
      expect(followerUser.followers_count).toEqual(0);
      expect(followingUser.followings_count).toEqual(0);
      expect(followingUser.followers_count).toEqual(1);
    });

    test('Response_404', async () => {
      const res = await request(server).post(
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

      const res = await request(server).post(
        `/users/${currUser.id}/followings/${following.id}`
      );

      expect(res.statusCode).toEqual(409);
    });

    test('Response_403', async () => {
      const res = await request(server).post(
        `/users/${following.id}/followings/${currUser.id}`
      );

      expect(res.statusCode).toEqual(403);
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
      const res = await request(server).delete(
        `/users/${currUser.id}/followings/${following.id}`
      );

      expect(res.statusCode).toEqual(204);
    });

    test('Response_403', async () => {
      const res = await request(server).delete(
        `/users/${following.id}/followings/${currUser.id}`
      );

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('GET /users/:user_id/followers', () => {
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
          {
            follower_user_id: testUserData.users[1].id,
            following_user_id: currUser.id,
          },
          {
            follower_user_id: testUserData.users[1].id,
            following_user_id: testUserData.users[2].id,
          },
          {
            follower_user_id: testUserData.users[2].id,
            following_user_id: currUser.id,
          },
          {
            follower_user_id: testUserData.users[2].id,
            following_user_id: testUserData.users[1].id,
          },
        ],
      });
    });

    afterAll(async () => {
      await prismaClient.follow.deleteMany({});
    });

    test('Response_200_With_Single_Follower', async () => {
      const res = await request(server)
        .get(`/users/${currUser.id}/followers`)
        .query({
          per_page: 1,
          page: 1,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
    });

    test('Response_200_With_Multiple_Followers', async () => {
      const res = await request(server)
        .get(`/users/${currUser.id}/followers`)
        .query({
          per_page: 2,
          page: 1,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
    });

    test('Response_200_With_Other_Users_Single_Follower', async () => {
      const res = await request(server)
        .get(`/users/${testUserData.users[1].id}/followers`)
        .query({
          per_page: 1,
          page: 2,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(1);
    });

    test('Response_200_With_Other_Users_Multiple_Followers', async () => {
      const res = await request(server)
        .get(`/users/${testUserData.users[1].id}/followers`)
        .query({
          per_page: 2,
          page: 1,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveLength(2);
    });
  });
});
