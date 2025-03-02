import prismaClient from '../../../src/database/clients/prisma';
jest.unmock('../../../src/database/clients/prisma.ts');
import request from 'supertest';
import server from '../../../src';
import testUserData from '../../data/user.json';
import { sampleLiveSessionFields } from '../../data/live-session';
import { accessLevel, liveSessionStatus } from '../../../src/enums/session';
import currUser from '../../data/curr-user';
import { createTestLiveSession } from '../../data/live-session';

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
      await prismaClient.live_session.deleteMany({});
      await prismaClient.follow.deleteMany({});
      await prismaClient.live_session_allow.deleteMany({});
    });

    describe('Public Session', () => {
      // public session은 authenticated user 모두가 가져올 수 있다.
      test('Response_200_With_Public_Live_Session', async () => {
        const liveSession = await createTestLiveSession({
          access_level: accessLevel.public,
          organizer_id: organizer.id,
          status: liveSessionStatus.opened,
        });

        const res = await request(server).get(
          `/sessions/live/${liveSession.id}`
        );

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('organizer_id', organizer.id);
      });
    });

    describe('Follower Only Session', () => {
      // user2가 생성한 follower only session을 follower인 사람은 가져올 수 있다.'
      test('Response_200_With_Follower_Only_Live_Session', async () => {
        const liveSession = await createTestLiveSession({
          access_level: accessLevel.public,
          organizer_id: organizer.id,
          status: liveSessionStatus.opened,
        });

        await prismaClient.follow.create({
          data: {
            follower_user_id: currUser.id,
            following_user_id: organizer.id,
          },
        });

        const res = await request(server).get(
          `/sessions/live/${liveSession.id}`
        );

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('organizer_id', organizer.id);
      });

      test('Response_403', async () => {
        const liveSession = await createTestLiveSession({
          access_level: accessLevel.followersOnly,
          organizer_id: organizer.id,
          status: liveSessionStatus.opened,
        });

        const res = await request(server).get(
          `/sessions/live/${liveSession.id}`
        );
        expect(res.statusCode).toEqual(403);
      });
    });

    describe('Private Session', () => {
      test('Response_200_With_Private_Session', async () => {
        const liveSession = await createTestLiveSession({
          access_level: accessLevel.private,
          organizer_id: organizer.id,
          status: liveSessionStatus.opened,
        });

        await prismaClient.live_session_allow.create({
          data: {
            live_session_id: liveSession.id,
            user_id: currUser.id,
          },
        });

        const res = await request(server).get(
          `/sessions/live/${liveSession.id}`
        );

        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('organizer_id', organizer.id);
      });

      test('Response_403', async () => {
        const liveSession = await createTestLiveSession({
          access_level: accessLevel.private,
          organizer_id: organizer.id,
          status: liveSessionStatus.opened,
        });

        const res = await request(server).get(
          `/sessions/live/${liveSession.id}`
        );

        expect(res.statusCode).toEqual(403);
      });
    });
  });

  describe('POST /sessions/live', () => {
    // 생성된 session을 모두 제거
    afterAll(async () => {
      await prismaClient.live_session.deleteMany({});
    });

    test('Response_201_With_Public_Live_Session', async () => {
      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', sampleLiveSessionFields.title)
        .field('description', sampleLiveSessionFields.description)
        .field('category', sampleLiveSessionFields.category)
        .field('access_level', accessLevel.public)
        .attach('thumbnail', sampleLiveSessionFields.getThumbnailReadable());

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('organizer_id', currUser.id);

      const thumbnailRes = await request(server).get(res.body.thumbnail_uri);

      expect(thumbnailRes.statusCode).toEqual(200);
    });

    test('Response_201_With_Public_Live_Session_thumbnail(x)', async () => {
      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', sampleLiveSessionFields.title)
        .field('description', sampleLiveSessionFields.description)
        .field('category', sampleLiveSessionFields.category)
        .field('access_level', accessLevel.public);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('organizer_id', currUser.id);
    });

    test('Response_201_With_Public_Live_Session', async () => {
      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', sampleLiveSessionFields.title)
        .field('description', sampleLiveSessionFields.description)
        .field('category', sampleLiveSessionFields.category)
        .field('access_level', accessLevel.public)
        .attach('thumbnail', sampleLiveSessionFields.getThumbnailReadable());

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('organizer_id', currUser.id);

      const thumbnailRes = await request(server).get(res.body.thumbnail_uri);

      expect(thumbnailRes.statusCode).toEqual(200);
    });

    test('Response_201_With_Private_Live_Session_thumbnail(x)', async () => {
      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', sampleLiveSessionFields.title)
        .field('description', sampleLiveSessionFields.description)
        .field('category', sampleLiveSessionFields.category)
        .field('access_level', accessLevel.private);

      expect(res.statusCode).toEqual(201);

      expect(res.body).toHaveProperty('organizer_id', currUser.id);
    });

    test('Response_400_With_access_level(?)', async () => {
      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', sampleLiveSessionFields.title)
        .field('description', sampleLiveSessionFields.description)
        .field('category', sampleLiveSessionFields.category)
        .field('access_level', 5);

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('PUT /sessions/live/:live_session_id/status', () => {
    afterEach(async () => {
      await prismaClient.live_session.deleteMany({});
      await prismaClient.follow.deleteMany({});
      await prismaClient.live_session_allow.deleteMany({});
    });

    test('Response_200_With_Status_Ready_To_Opened', async () => {
      const newLiveSession = await createTestLiveSession({
        access_level: accessLevel.public,
        organizer_id: currUser.id,
        status: liveSessionStatus.ready,
      });

      expect(newLiveSession).toBeDefined();

      const res = await request(server)
        .put(`/sessions/live/${newLiveSession.id}/status`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          status: liveSessionStatus.opened,
        });

      expect(res.status).toEqual(200);

      const liveSession = await prismaClient.live_session.findFirst({
        where: {
          id: newLiveSession.id,
        },
      });

      expect(liveSession?.status).toEqual(liveSessionStatus.opened);
      // 첫 ready => open은 started_at을 지정한다.
      expect(liveSession?.started_at).toBeDefined();
    });

    // live session status 변경 요청에 status가 지정되지 않으면 400을 응답받아야한다.
    test('Response_400_status(x)', async () => {
      const liveSession = await createTestLiveSession({
        access_level: accessLevel.public,
        organizer_id: currUser.id,
        status: liveSessionStatus.ready,
      });

      expect(liveSession).toBeDefined();

      const res = await request(server)
        .put(`/sessions/live/${liveSession.id}/status`)
        .set('Content-Type', 'application/x-www-form-urlencoded');

      expect(res.statusCode).toEqual(400);
    });

    // 다른 사용자의 live session status 변경을 요청하면 403을 응답받아야한다.
    test('Response_403', async () => {
      const organizer = testUserData.users[1];

      const liveSession = await createTestLiveSession({
        access_level: accessLevel.public,
        organizer_id: organizer.id,
        status: liveSessionStatus.ready,
      });

      expect(liveSession).toBeDefined();

      const res = await request(server)
        .put(`/sessions/live/${liveSession.id}/status`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          status: liveSessionStatus.opened,
        });

      expect(res.statusCode).toEqual(403);
    });
  });
});
