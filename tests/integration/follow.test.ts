import prismaClient from '../../src/database/clients/prisma';
import request from 'supertest';
import server from '../../src';
import currUser from '../data/curr-user';
import { userFactory } from '../factories';
import { user } from '@prisma/client';

describe('Follow API', () => {
  let user1: user;
  let user2: user;
  let user3: user;

  beforeAll(async () => {
    [user1, user2, user3] = await userFactory.createManyAndSave({ count: 3 });
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
            following_user_id: user1.id,
          },
          {
            follower_user_id: currUser.id,
            following_user_id: user2.id,
          },
          {
            follower_user_id: user1.id,
            following_user_id: currUser.id,
          },
          {
            follower_user_id: user1.id,
            following_user_id: user2.id,
          },
          {
            follower_user_id: user2.id,
            following_user_id: currUser.id,
          },
          {
            follower_user_id: user2.id,
            following_user_id: user1.id,
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
      expect(res.body.data).toHaveLength(1);
    });

    test('Response_200_With_Multiple_Followings', async () => {
      const res = await request(server)
        .get(`/users/${currUser.id}/followings`)
        .query({
          per_page: 2,
          page: 1,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveLength(2);
    });

    test('Response_200_With_Other_Users_Single_Following', async () => {
      const res = await request(server)
        .get(`/users/${user1.id}/followings`)
        .query({
          per_page: 1,
          page: 2,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveLength(1);
    });

    test('Response_200_With_Other_Users_Multiple_Followings', async () => {
      const res = await request(server)
        .get(`/users/${user1.id}/followings`)
        .query({
          per_page: 2,
          page: 1,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveLength(2);
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
            following_user_id: user1.id,
          },
          {
            follower_user_id: user1.id,
            following_user_id: currUser.id,
          },
          {
            follower_user_id: user1.id,
            following_user_id: user2.id,
          },
          {
            follower_user_id: user2.id,
            following_user_id: currUser.id,
          },
          {
            follower_user_id: user2.id,
            following_user_id: user1.id,
          },
        ],
      });
    });

    afterAll(async () => {
      await prismaClient.follow.deleteMany({});
    });

    test('Response_200', async () => {
      const res = await request(server).get(
        `/users/${currUser.id}/followings/${user1.id}`
      );

      expect(res.statusCode).toEqual(200);
    });

    test('Response_404', async () => {
      const res = await request(server).get(
        `/users/${currUser.id}/followings/${user2.id}`
      );

      expect(res.statusCode).toEqual(404);
    });
  });

  describe('POST /users/:user_id/followings/:following_user_id', () => {
    afterEach(async () => {
      await prismaClient.follow.deleteMany({});
    });

    test('Response_200_With_Following', async () => {
      const res = await request(server).post(
        `/users/${currUser.id}/followings/${user1.id}`
      );

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.follower_user_id).toEqual(currUser.id);
      expect(res.body.data.following_user_id).toEqual(user1.id);

      const followerUser = (await request(server).get(`/users/${currUser.id}`))
        .body.data;
      const followingUser = (await request(server).get(`/users/${user1.id}`))
        .body.data;

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
          following_user_id: user1.id,
        },
      });

      const res = await request(server).post(
        `/users/${currUser.id}/followings/${user1.id}`
      );

      expect(res.statusCode).toEqual(409);
    });

    test('Response_403', async () => {
      const res = await request(server).post(
        `/users/${user1.id}/followings/${currUser.id}`
      );

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('DELETE /users/:user_id/followings/:following_user_id', () => {
    beforeEach(async () => {
      await prismaClient.follow.create({
        data: {
          following_user_id: user2.id,
          follower_user_id: currUser.id,
        },
      });
    });

    afterEach(async () => [await prismaClient.follow.deleteMany()]);

    test('Response_204', async () => {
      const res = await request(server).delete(
        `/users/${currUser.id}/followings/${user2.id}`
      );

      expect(res.statusCode).toEqual(204);
    });

    test('Response_404_user_id(does_not_exist)', async () => {
      const res = await request(server).delete(
        `/users/${currUser.id}/followings/${currUser.id}`
      );

      expect(res.statusCode).toEqual(404);
    });

    test('Response_404_following_user_id(does_not_exist)', async () => {
      const res = await request(server).delete(
        `/users/${currUser.id}/followings/${currUser.id}`
      );

      expect(res.statusCode).toEqual(404);
    });

    test('Response_403', async () => {
      const res = await request(server).delete(
        `/users/${user2.id}/followings/${currUser.id}`
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
            following_user_id: user2.id,
          },
          {
            follower_user_id: currUser.id,
            following_user_id: user3.id,
          },
          {
            follower_user_id: user2.id,
            following_user_id: currUser.id,
          },
          {
            follower_user_id: user2.id,
            following_user_id: user3.id,
          },
          {
            follower_user_id: user3.id,
            following_user_id: currUser.id,
          },
          {
            follower_user_id: user3.id,
            following_user_id: user2.id,
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
      expect(res.body.data).toHaveLength(1);
    });

    test('Response_200_With_Multiple_Followers', async () => {
      const res = await request(server)
        .get(`/users/${currUser.id}/followers`)
        .query({
          per_page: 2,
          page: 1,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveLength(2);
    });

    test('Response_404', async () => {
      const res = await request(server).get(`/users/-1/followers`).query({
        per_page: 1,
        page: 1,
      });

      expect(res.statusCode).toEqual(404);
    });

    test('Response_200_With_Other_Users_Single_Follower', async () => {
      const res = await request(server)
        .get(`/users/${user2.id}/followers`)
        .query({
          per_page: 1,
          page: 2,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveLength(1);
    });

    test('Response_200_With_Other_Users_Multiple_Followers', async () => {
      const res = await request(server)
        .get(`/users/${user2.id}/followers`)
        .query({
          per_page: 2,
          page: 1,
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveLength(2);
    });
  });
});
