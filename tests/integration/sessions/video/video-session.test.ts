import prismaClient from '../../../../src/database/clients/prisma';
import request from 'supertest';
import server from '../../../../src';
import currUser from '../../../data/curr-user';
import { access_level, user } from '@prisma/client';
import httpStatusCode from 'http-status-codes';
import { videoSessionFactory } from '../../../factories/video-session-factory';
import { userFactory } from '../../../factories';
import categoryFactory from '../../../factories/category-factory';
import type { category } from '@prisma/client';

describe('Video Session API', () => {
  let user1: user;
  beforeAll(async () => {
    user1 = await userFactory.createAndSave();
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => {
      server.on('close', resolve);
      server.close();
    });

    await videoSessionFactory.cleanup();
  });

  describe('GET /sessions/video/:video_session_id', () => {
    afterEach(async () => {
      await prismaClient.video_session.deleteMany({});
      await prismaClient.follow.deleteMany({});
      await prismaClient.video_session_allow.deleteMany({});
    });

    test('Response_200_With_Public_Video_Session', async () => {
      const videoSession = await videoSessionFactory.createAndSave({
        access_level: access_level.PUBLIC,
        organizer: { connect: { id: user1.id } },
      });

      const res = await request(server).get(
        `/sessions/video/${videoSession.id}`
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty('id', videoSession.id);
    });

    test('Response_200_With_Follower_Only_Video_Session', async () => {
      const videoSession = await videoSessionFactory.createAndSave({
        access_level: access_level.FOLLOWER_ONLY,
        organizer: { connect: { id: user1.id } },
      });

      await prismaClient.follow.create({
        data: { follower_user_id: currUser.id, following_user_id: user1.id },
      });

      const res = await request(server).get(
        `/sessions/video/${videoSession.id}`
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty('id', videoSession.id);
    });

    test('Response_403_For_Follower_Only_Without_Follow', async () => {
      const videoSession = await videoSessionFactory.createAndSave({
        access_level: access_level.FOLLOWER_ONLY,
        organizer: { connect: { id: user1.id } },
      });

      const res = await request(server).get(
        `/sessions/video/${videoSession.id}`
      );

      expect(res.statusCode).toEqual(403);
    });

    test('Response_200_With_Private_Video_Session', async () => {
      const videoSession = await videoSessionFactory.createAndSave({
        access_level: access_level.PRIVATE,
        organizer: { connect: { id: user1.id } },
      });

      await prismaClient.video_session_allow.create({
        data: { video_session_id: videoSession.id, user_id: currUser.id },
      });

      const res = await request(server).get(
        `/sessions/video/${videoSession.id}`
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty('id', videoSession.id);
    });

    test('Response_403_Private_Without_Allow', async () => {
      const videoSession = await videoSessionFactory.createAndSave({
        access_level: access_level.PRIVATE,
        organizer: { connect: { id: user1.id } },
      });

      const res = await request(server).get(
        `/sessions/video/${videoSession.id}`
      );

      expect(res.statusCode).toEqual(403);
    });
  });

  describe('GET /sessions/video', () => {
    beforeAll(async () => {
      await videoSessionFactory.createManyAndSave({
        count: 2,
        overrides: {
          access_level: access_level.PUBLIC,
          organizer: { connect: { id: user1.id } },
        },
      });

      await videoSessionFactory.createManyAndSave({
        count: 2,
        overrides: {
          access_level: access_level.PUBLIC,
          organizer: { connect: { id: user1.id } },
        },
      });
    });

    afterAll(async () => {
      await prismaClient.video_session.deleteMany({});
    });

    describe('Search_With_Pagination', () => {
      test('Response_200_With_Pagination', async () => {
        const res = await request(server)
          .get('/sessions/video')
          .query({ per_page: 10, page: 1 });

        expect(res.statusCode).toEqual(httpStatusCode.OK);
        expect(res.body.data).toBeDefined();
        expect(res.body.data.length).toBeGreaterThanOrEqual(4);
      });
    });

    describe('Search_With_Category', () => {
      const categories: category[] = [];
      beforeAll(async () => {
        categories.push(
          ...(await categoryFactory.createManyAndSave({
            count: 4,
          }))
        );
      });

      for (const category of categories) {
        test(`Response_200_With_${category.label.toUpperCase()}_Categorized_Live_Session`, async () => {
          const res = await request(server)
            .get(`/sessions/live`)
            .query({ category: category.label });

          expect(res.status).toEqual(httpStatusCode.OK);
          expect(res.body.data).toBeDefined();

          for (let i = 0; i < res.body.data.length; i++) {
            expect(res.body.data[i].category).toEqual(category.label);
          }
        });
      }

      test('Response_Empty_Video_Session_Category(?)', async () => {
        const res = await request(server)
          .get('/sessions/video')
          .query({ category: 'non-existing-category' });

        expect(res.status).toEqual(httpStatusCode.OK);
        expect(res.body.data).toBeDefined();
        expect(res.body.data).toHaveLength(0);
      });
    });
  });
});
