import prismaClient from '../../../src/database/clients/prisma';
jest.unmock('../../../src/database/clients/prisma.ts');
import request from 'supertest';
import server from '../../../src';
import testUserData from '../../data/user.json';
import testSessionData from '../../data/session.json';
import fs from 'node:fs';

describe('Live Session API', () => {
  const currUser = testUserData.currUser;
  beforeAll(async () => {
    // create test user
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

  describe('POST /sessions/live', () => {
    // 생성된 session을 모두 제거
    afterAll(async () => {
      await prismaClient.session.deleteMany({});
    });

    test('Response_201_With_Public_Live_Session', async () => {
      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', testSessionData.newPublicLiveSession.title)
        .field('description', testSessionData.newPublicLiveSession.description)
        .field('category', testSessionData.newPublicLiveSession.category)
        .field(
          'access_level',
          testSessionData.newPublicLiveSession.access_level
        )
        .attach(
          'thumbnail',
          fs.createReadStream('./tests/data/images/image.png')
        );

      expect(res.statusCode).toEqual(201);
      expect(res.body).toMatchObject(testSessionData.newPublicLiveSession);
      expect(res.body).toHaveProperty('organizer_id', currUser.id);

      const thumbnailRes = await request(server).get(res.body.thumbnail_url);

      expect(thumbnailRes.statusCode).toEqual(200);
    });

    test('Response_201_With_Public_Live_Session_thumbnail(x)', async () => {
      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', testSessionData.newPublicLiveSession.title)
        .field('description', testSessionData.newPublicLiveSession.description)
        .field('category', testSessionData.newPublicLiveSession.category)
        .field(
          'access_level',
          testSessionData.newPublicLiveSession.access_level
        );

      expect(res.statusCode).toEqual(201);
      expect(res.body).toMatchObject(testSessionData.newPublicLiveSession);
      expect(res.body).toHaveProperty(
        'thumbnail_url',
        testSessionData.default.thumbnail_url
      );
      expect(res.body).toHaveProperty('organizer_id', currUser.id);
    });

    test('Response_201_With_Public_Live_Session', async () => {
      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', testSessionData.newPrivateLiveSession.title)
        .field('description', testSessionData.newPrivateLiveSession.description)
        .field('category', testSessionData.newPrivateLiveSession.category)
        .field(
          'access_level',
          testSessionData.newPrivateLiveSession.access_level
        )
        .attach(
          'thumbnail',
          fs.createReadStream('./tests/data/images/image.png')
        );

      expect(res.statusCode).toEqual(201);
      expect(res.body).toMatchObject(testSessionData.newPrivateLiveSession);
      expect(res.body).toHaveProperty('organizer_id', currUser.id);

      const thumbnailRes = await request(server).get(res.body.thumbnail_url);

      expect(thumbnailRes.statusCode).toEqual(200);
    });

    test('Response_201_With_Private_Live_Session_thumbnail(x)', async () => {
      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', testSessionData.newPrivateLiveSession.title)
        .field('description', testSessionData.newPrivateLiveSession.description)
        .field('category', testSessionData.newPrivateLiveSession.category)
        .field(
          'access_level',
          testSessionData.newPrivateLiveSession.access_level
        );

      expect(res.statusCode).toEqual(201);
      expect(res.body).toMatchObject(testSessionData.newPrivateLiveSession);
      expect(res.body).toHaveProperty(
        'thumbnail_url',
        testSessionData.default.thumbnail_url
      );
      expect(res.body).toHaveProperty('organizer_id', currUser.id);
    });

    test('Response_400_With_access_level(?)', async () => {
      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', testSessionData.newPrivateLiveSession.title)
        .field('description', testSessionData.newPrivateLiveSession.description)
        .field('category', testSessionData.newPrivateLiveSession.category)
        .field('access_level', 5);

      expect(res.statusCode).toEqual(400);
    });
  });
});
