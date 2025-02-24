import prismaClient from '../../../src/database/clients/prisma';
jest.unmock('../../../src/database/clients/prisma.ts');
import request from 'supertest';
import server from '../../../src';
import testUserData from '../../data/user.json';
import testSessionData from '../../data/session.json';
import fs from 'node:fs';
import { v4 } from 'uuid';
import { liveSessionStatus } from '../../../src/enums/session';
import currUser from '../../data/curr-user';

describe('Live Session API', () => {
  beforeAll(async () => {
    await currUser.insert();
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

  describe('GET /sessions/live/:live_session_id', () => {
    const organizer = testUserData.users[0];

    afterEach(async () => {
      await prismaClient.session.deleteMany({});
      await prismaClient.follow.deleteMany({});
      await prismaClient.session_allow.deleteMany({});
    });

    describe('Public Session', () => {
      // user2가 생성한 public session은 누구나 가져올 수 있다.
      test('Response_200_With_Public_Live_Session', async () => {
        const session = await prismaClient.session.create({
          data: {
            id: v4(),
            ...testSessionData.newPublicLiveSession,
            thumbnail_url: testSessionData.default.thumbnail_url,
            organizer_id: organizer.id,
            session_live: {
              create: {
                status: liveSessionStatus.ready,
              },
            },
          },
        });

        const res = await request(server).get(`/sessions/live/${session.id}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject(testSessionData.newPublicLiveSession);
        expect(res.body).toHaveProperty('organizer_id', organizer.id);
        expect(res.body.session_live).toMatchObject(
          testSessionData.default.session_live
        );
      });
    });

    describe('Follower Only Session', () => {
      // user2가 생성한 follower only session을 follower인 사람은 가져올 수 있다.'
      test('Response_200_With_Follower_Only_Live_Session', async () => {
        const session = await prismaClient.session.create({
          data: {
            id: v4(),
            ...testSessionData.newFollowerOnlyLiveSession,
            thumbnail_url: testSessionData.default.thumbnail_url,
            organizer_id: organizer.id,
            session_live: {
              create: {
                status: liveSessionStatus.ready,
              },
            },
          },
        });

        await prismaClient.follow.create({
          data: {
            follower_user_id: currUser.id,
            following_user_id: organizer.id,
          },
        });

        const res = await request(server).get(`/sessions/live/${session.id}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject(
          testSessionData.newFollowerOnlyLiveSession
        );
        expect(res.body).toHaveProperty('organizer_id', organizer.id);
        expect(res.body.session_live).toMatchObject(
          testSessionData.default.session_live
        );
      });

      test('Response_403', async () => {
        const session = await prismaClient.session.create({
          data: {
            id: v4(),
            ...testSessionData.newFollowerOnlyLiveSession,
            thumbnail_url: testSessionData.default.thumbnail_url,
            organizer_id: organizer.id,
            session_live: {
              create: {
                status: liveSessionStatus.ready,
              },
            },
          },
        });

        const res = await request(server).get(`/sessions/live/${session.id}`);
        expect(res.statusCode).toEqual(403);
      });
    });

    describe('Private Session', () => {
      test('Response_200_With_Private_Session', async () => {
        const session = await prismaClient.session.create({
          data: {
            id: v4(),
            ...testSessionData.newPrivateLiveSession,
            thumbnail_url: testSessionData.default.thumbnail_url,
            organizer_id: organizer.id,
            session_live: {
              create: {
                status: liveSessionStatus.ready,
              },
            },
          },
        });

        await prismaClient.session_allow.create({
          data: {
            session_id: session.id,
            user_id: currUser.id,
          },
        });

        const res = await request(server).get(`/sessions/live/${session.id}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body).toMatchObject(testSessionData.newPrivateLiveSession);
        expect(res.body).toHaveProperty('organizer_id', organizer.id);
        expect(res.body.session_live).toMatchObject(
          testSessionData.default.session_live
        );
      });

      test('Response_403', async () => {
        const session = await prismaClient.session.create({
          data: {
            id: v4(),
            ...testSessionData.newPrivateLiveSession,
            thumbnail_url: testSessionData.default.thumbnail_url,
            organizer_id: organizer.id,
            session_live: {
              create: {
                status: liveSessionStatus.ready,
              },
            },
          },
        });

        const res = await request(server).get(`/sessions/live/${session.id}`);
        expect(res.statusCode).toEqual(403);
      });
    });
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

  describe('PUT /sessions/live/:live_session_id/status', () => {
    afterEach(async () => {
      await prismaClient.session.deleteMany({});
      await prismaClient.follow.deleteMany({});
      await prismaClient.session_allow.deleteMany({});
    });

    test('Response_200_With_Status_Ready_To_Opened', async () => {
      const newLiveSession = await prismaClient.session.create({
        data: {
          id: v4(),
          ...testSessionData.newPublicLiveSession,
          thumbnail_url: testSessionData.default.thumbnail_url,
          organizer_id: currUser.id,
          session_live: {
            create: {
              status: liveSessionStatus.ready,
            },
          },
        },
      });

      expect(newLiveSession).toBeDefined();

      const res = await request(server)
        .put(`/sessions/live/${newLiveSession.id}/status`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          status: liveSessionStatus.opened,
        });

      expect(res.status).toEqual(200);

      const session = await prismaClient.session.findFirst({
        where: {
          id: newLiveSession.id,
        },
        include: {
          session_live: true,
        },
      });

      expect(session?.session_live?.status).toEqual(liveSessionStatus.opened);
      // 첫 ready => open은 started_at을 지정한다.
      expect(session?.session_live?.started_at).toBeDefined();
    });

    test('Response_400', async () => {
      const session = await prismaClient.session.create({
        data: {
          id: v4(),
          ...testSessionData.newPublicLiveSession,
          thumbnail_url: testSessionData.default.thumbnail_url,
          organizer_id: currUser.id,
          session_live: {
            create: {
              status: liveSessionStatus.ready,
            },
          },
        },
      });

      expect(session).toBeDefined();

      const res = await request(server)
        .put(`/sessions/live/${session.id}/status`)
        .set('Content-Type', 'application/x-www-form-urlencoded');

      expect(res.statusCode).toEqual(400);
    });

    test('Response_403', async () => {
      const organizer = testUserData.users[1];

      const session = await prismaClient.session.create({
        data: {
          id: v4(),
          ...testSessionData.newPublicLiveSession,
          thumbnail_url: testSessionData.default.thumbnail_url,
          organizer_id: organizer.id,
          session_live: {
            create: {
              status: liveSessionStatus.ready,
            },
          },
        },
      });

      expect(session).toBeDefined();

      const res = await request(server)
        .put(`/sessions/live/${session.id}/status`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          status: liveSessionStatus.opened,
        });

      expect(res.statusCode).toEqual(403);
    });
  });
});
