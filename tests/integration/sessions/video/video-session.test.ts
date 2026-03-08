// Mock mediabunny to avoid real media server calls during tests
jest.mock('mediabunny', () => {
  class MockUrlSource {
    url: string;
    constructor(url: string) {
      this.url = url;
    }
  }

  class MockMediaInfo {
    opts: any;
    constructor(opts: any) {
      this.opts = opts;
    }

    async computeDuration() {
      return 1000; // return a fixed duration (ms or seconds as expected)
    }
  }

  return {
    Input: MockMediaInfo,
    ALL_FORMATS: [],
    UrlSource: MockUrlSource,
  };
});

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
import { VideoSessionWithAll } from '../../../../src/@types/video-session';
import fs from 'node:fs';

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

  describe('POST /sessions/video', () => {
    // 생성된 session을 모두 제거
    afterAll(async () => {
      await videoSessionFactory.cleanup();
    });

    test('Response_201_With_Only_Required_Fields', async () => {
      const res = await request(server)
        .post('/sessions/video')
        .set('Content-Type', 'multipart/form-data')
        .field('video_id', 'test-video-id')
        .field('access_level', access_level.PUBLIC);

      expect(res.statusCode).toEqual(201);

      expect(res.body.data).toHaveProperty('organizer_id', currUser.id);

      const thumbnailRes = await request(server).get(
        res.body.data.thumbnail_uri
      );

      expect(thumbnailRes.statusCode).toEqual(200);
    });

    test('Response_400_With_Only_Non_Required_Fields', async () => {
      const res = await request(server)
        .post('/sessions/video')
        .set('Content-Type', 'multipart/form-data')
        .field('title', 'Test Video Session')
        .field('description', 'This is a test video session')
        .field('category_label', 'test');

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('PUT /sessions/video/:video_session_id', () => {
    let videoSession: VideoSessionWithAll;

    beforeEach(async () => {
      videoSession = await videoSessionFactory.createAndSave({
        access_level: access_level.PUBLIC,
        organizer: { connect: { id: currUser.id } },
      });
    });

    afterAll(async () => {
      await videoSessionFactory.cleanup();
    });

    test('Response_200_With_Updated_Title', async () => {
      const newTitle = 'Updated Video Session Title';
      const res = await request(server)
        .put(`/sessions/video/${videoSession.id}`)
        .set('Content-Type', 'application/json')
        .send({ title: newTitle });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty('title', newTitle);
    });

    test('Response_200_With_Updated_Description', async () => {
      const newDescription = 'Updated description for the video session';
      const res = await request(server)
        .put(`/sessions/video/${videoSession.id}`)
        .set('Content-Type', 'application/json')
        .send({ description: newDescription });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty('description', newDescription);
    });

    test('Response_200_With_Updated_Access_Level', async () => {
      const newAccessLevel = access_level.PRIVATE;
      const res = await request(server)
        .put(`/sessions/video/${videoSession.id}`)
        .set('Content-Type', 'application/json')
        .send({ access_level: newAccessLevel });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveProperty('access_level', newAccessLevel);
    });

    test('Response_200_With_Updated_Category', async () => {
      const newCategoryLabel = 'updated-category';

      const category = await categoryFactory.createAndSave({
        label: newCategoryLabel,
      });

      const res = await request(server)
        .put(`/sessions/video/${videoSession.id}`)
        .set('Content-Type', 'application/json')
        .send({ category_label: category.label });

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.category).toHaveProperty('label', category.label);

      await categoryFactory.delete({ label: newCategoryLabel });
    });

    test('Response_200_With_Thumbnail', async () => {
      const res = await request(server)
        .put(`/sessions/video/${videoSession.id}`)
        .set('Content-Type', 'multipart/form-data')
        .attach(
          'thumbnail',
          fs.createReadStream('./tests/data/images/image.png')
        );

      const thumbnailRes = await request(server).get(
        res.body.data.thumbnail_uri
      );

      expect(thumbnailRes.statusCode).toEqual(200);
    });

    test('Response_400_With_Invalid_Access_Level', async () => {
      const res = await request(server)
        .put(`/sessions/video/${videoSession.id}`)
        .set('Content-Type', 'application/json')
        .send({ access_level: 999 });

      expect(res.statusCode).toEqual(400);
    });

    test('Response_400_With_Nonexistent_Category', async () => {
      const res = await request(server)
        .put(`/sessions/video/${videoSession.id}`)
        .set('Content-Type', 'application/json')
        .send({ category_label: 'nonexistent-category' });

      expect(res.statusCode).toEqual(400);
    });

    test('Response_400_With_Empty_Title', async () => {
      const res = await request(server)
        .put(`/sessions/video/${videoSession.id}`)
        .set('Content-Type', 'application/json')
        .send({ title: '' });

      expect(res.statusCode).toEqual(400);
    });

    test('Response_400_With_Empty_Description', async () => {
      const res = await request(server)
        .put(`/sessions/video/${videoSession.id}`)
        .set('Content-Type', 'application/json')
        .send({ description: '' });

      expect(res.statusCode).toEqual(400);
    });

    test('Response_403_When_User_Is_Not_Organizer', async () => {
      const otherUser = await userFactory.createAndSave();
      const newCategoryLabel = 'some-category';

      const category = await categoryFactory.createAndSave({
        label: newCategoryLabel,
      });

      const otherUserVideoSession = await videoSessionFactory.createAndSave({
        access_level: access_level.PUBLIC,
        organizer: { connect: { id: otherUser.id } },
      });

      const res = await request(server)
        .put(`/sessions/video/${otherUserVideoSession.id}`)
        .set('Content-Type', 'application/json')
        .send({ title: 'Attempted Update' });

      expect(res.statusCode).toEqual(403);

      await userFactory.delete({ id: otherUser.id });
      await categoryFactory.delete({ label: newCategoryLabel });
    });

    test('Response_404_When_Video_Session_Does_Not_Exist', async () => {
      const res = await request(server)
        .put('/sessions/video/doesNotExistVideoSessionId')
        .set('Content-Type', 'application/json')
        .send({ title: 'Attempted Update' });

      expect(res.statusCode).toEqual(404);
    });
  });
});
