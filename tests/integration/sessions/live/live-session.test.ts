import prismaClient from '../../../../src/database/clients/prisma';
jest.unmock('../../../../src/database/clients/prisma.ts');
import request from 'supertest';
import server from '../../../../src';
import testUserData from '../../../data/user.json';
import { sampleLiveSessionFields } from '../../../data/live-session';
import currUser from '../../../data/curr-user';
import { createTestLiveSession } from '../../../data/live-session';
import { live_session_status, access_level } from '@prisma/client';
import categories from '../../../../static/data/category.json';
import httpStatusCode from 'http-status-codes';

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
          access_level: access_level.PUBLIC,
          organizer_id: organizer.id,
          status: live_session_status.OPENED,
        });

        const res = await request(server).get(
          `/sessions/live/${liveSession.id}`
        );

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveProperty('organizer_id', organizer.id);
        // stream key는 숨겨져 있어야한다.
        expect(res.body.data.stream_key).toBeUndefined();
      });
    });

    describe('Follower Only Session', () => {
      // user2가 생성한 follower only session을 follower인 사람은 가져올 수 있다.'
      test('Response_200_With_Follower_Only_Live_Session', async () => {
        const liveSession = await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: organizer.id,
          status: live_session_status.OPENED,
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
        expect(res.body.data).toHaveProperty('organizer_id', organizer.id);
        // stream key는 숨겨져 있어야한다.
        expect(res.body.data.stream_key).toBeUndefined();
      });

      test('Response_403', async () => {
        const liveSession = await createTestLiveSession({
          access_level: access_level.FOLLOWER_ONLY,
          organizer_id: organizer.id,
          status: live_session_status.OPENED,
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
          access_level: access_level.PRIVATE,
          organizer_id: organizer.id,
          status: live_session_status.OPENED,
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
        expect(res.body.data).toHaveProperty('organizer_id', organizer.id);
      });

      test('Response_403', async () => {
        const liveSession = await createTestLiveSession({
          access_level: access_level.PRIVATE,
          organizer_id: organizer.id,
          status: live_session_status.OPENED,
        });

        const res = await request(server).get(
          `/sessions/live/${liveSession.id}`
        );

        expect(res.statusCode).toEqual(403);
      });
    });
  });

  describe('GET /sessions/live', () => {
    const organizer = testUserData.users[1];

    beforeAll(async () => {
      // other user's public live session
      for (let i = 0; i < 2; i++) {
        await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: organizer.id,
          status: live_session_status.OPENED,
        });
      }

      // other user's private live session
      for (let i = 0; i < 2; i++) {
        await createTestLiveSession({
          access_level: access_level.FOLLOWER_ONLY,
          organizer_id: organizer.id,
          status: live_session_status.OPENED,
        });
      }

      // curr user's public live session
      for (let i = 0; i < 2; i++) {
        await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: currUser.id,
          status: live_session_status.OPENED,
        });
      }

      // curr user's follower only live session
      for (let i = 0; i < 2; i++) {
        await createTestLiveSession({
          access_level: access_level.FOLLOWER_ONLY,
          organizer_id: currUser.id,
          status: live_session_status.OPENED,
        });
      }

      // curr user's private live session
      for (let i = 0; i < 2; i++) {
        await createTestLiveSession({
          access_level: access_level.PRIVATE,
          organizer_id: currUser.id,
          status: live_session_status.OPENED,
        });
      }
    });

    afterAll(async () => {
      await prismaClient.live_session.deleteMany({});
    });

    describe('Other_Live_Session(Public)_And_All_Curr_User_Live_Session(All)', () => {
      test('Response_200_With_8_Live_Session', async () => {
        const res = await request(server).get('/sessions/live').query({
          per_page: 10,
          page: 1,
        });

        expect(res.statusCode).toEqual(200);

        expect(res.body.data).toHaveLength(8);
      });
    });

    describe('Other_Live_Session(Public, Followers Only)_And_Curr_User_Live_Session(All)', () => {
      beforeAll(async () => {
        await prismaClient.follow.create({
          data: {
            follower_user_id: currUser.id,
            following_user_id: organizer.id,
          },
        });
      });

      afterAll(async () => {
        await prismaClient.follow.deleteMany({});
      });

      test('Response_200_With_10_Live_Session', async () => {
        const res = await request(server).get('/sessions/live').query({
          per_page: 12,
          page: 1,
        });

        expect(res.statusCode).toEqual(200);

        expect(res.body.data).toHaveLength(10);
      });
    });

    describe('Other_Live_Session(Public, Private)_And_Curr_User_Live_Session', () => {
      beforeAll(async () => {
        await prismaClient.follow.create({
          data: {
            follower_user_id: currUser.id,
            following_user_id: organizer.id,
          },
        });

        // other user's follower only live session
        for (let i = 0; i < 2; i++) {
          const liveSession = await createTestLiveSession({
            access_level: access_level.PRIVATE,
            organizer_id: organizer.id,
            status: live_session_status.OPENED,
          });

          await prismaClient.live_session_allow.create({
            data: {
              live_session_id: liveSession.id,
              user_id: currUser.id,
            },
          });
        }
      });

      afterAll(async () => {
        await prismaClient.follow.deleteMany({});
        await prismaClient.live_session_allow.deleteMany({});
      });

      test('Response_200_With_10_Live_Session', async () => {
        const res = await request(server).get('/sessions/live').query({
          per_page: 12,
          page: 1,
        });

        expect(res.statusCode).toEqual(200);

        expect(res.body.data).toHaveLength(12);
      });
    });

    describe('Categorized_Live_Session', () => {
      beforeAll(async () => {
        for (const category of categories) {
          for (let i = 0; i < 2; i++) {
            await createTestLiveSession({
              category: category.label,
            });
          }
        }
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

      test('Response_Empty_Live_Session_Category(?)', async () => {
        const res = await request(server).get(
          `/sessions/live?category=doesNotExistLiveSession`
        );

        expect(res.status).toEqual(httpStatusCode.OK);
        expect(res.body.data).toBeDefined();
        expect(res.body.data).toHaveLength(0);
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
        .field('access_level', access_level.PUBLIC)
        .attach('thumbnail', sampleLiveSessionFields.getThumbnailReadable());

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty('organizer_id', currUser.id);
      // stream key는 숨겨져 있어야한다.
      expect(res.body.data.stream_key).toBeUndefined();

      const thumbnailRes = await request(server).get(
        res.body.data.thumbnail_uri
      );

      expect(thumbnailRes.statusCode).toEqual(200);
    });

    test('Response_201_With_Public_Live_Session_thumbnail(x)', async () => {
      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', sampleLiveSessionFields.title)
        .field('description', sampleLiveSessionFields.description)
        .field('category', sampleLiveSessionFields.category)
        .field('access_level', access_level.PUBLIC);

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty('organizer_id', currUser.id);
      // stream key는 숨겨져 있어야한다.
      expect(res.body.data.stream_key).toBeUndefined();
    });

    test('Response_201_With_Public_Live_Session', async () => {
      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', sampleLiveSessionFields.title)
        .field('description', sampleLiveSessionFields.description)
        .field('category', sampleLiveSessionFields.category)
        .field('access_level', access_level.PUBLIC)
        .attach('thumbnail', sampleLiveSessionFields.getThumbnailReadable());

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty('organizer_id', currUser.id);
      // stream key는 숨겨져 있어야한다.
      expect(res.body.data.stream_key).toBeUndefined();

      const thumbnailRes = await request(server).get(
        res.body.data.thumbnail_uri
      );

      expect(thumbnailRes.statusCode).toEqual(200);
    });

    test('Response_201_With_Private_Live_Session_thumbnail(x)', async () => {
      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', sampleLiveSessionFields.title)
        .field('description', sampleLiveSessionFields.description)
        .field('category', sampleLiveSessionFields.category)
        .field('access_level', access_level.PRIVATE);

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty('organizer_id', currUser.id);
      // stream key는 숨겨져 있어야한다.
      expect(res.body.data.stream_key).toBeUndefined();
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
      // status update로 생성된 transition log를 제거한다.
      await prismaClient.live_session_transition_log.deleteMany({});
      await prismaClient.follow.deleteMany({});
    });

    describe('Ready To ', () => {
      const statusFrom = live_session_status.READY;

      test('Response_200_With_Status_Ready_To_Opened', async () => {
        const statusTo = live_session_status.OPENED;

        const newLiveSession = await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: currUser.id,
          status: statusFrom,
        });

        expect(newLiveSession).toBeDefined();

        const res = await request(server)
          .put(`/sessions/live/${newLiveSession.id}/status`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            status: statusTo,
          });

        expect(res.status).toEqual(200);

        const liveSession = await prismaClient.live_session.findFirst({
          where: {
            id: newLiveSession.id,
          },
        });

        expect(liveSession?.status).toEqual(statusTo);
        // 첫 ready => open은 started_at을 지정한다.
        expect(liveSession?.started_at).toBeDefined();

        const transitionLog =
          await prismaClient.live_session_transition_log.findFirst({
            where: {
              live_session_id: newLiveSession.id,
            },
          });

        expect(transitionLog?.from_state).toEqual(live_session_status.READY);
        expect(transitionLog?.to_state).toEqual(live_session_status.OPENED);
      });

      test('Response_400_With_Status_Ready_To_Breaked', async () => {
        const statusTo = live_session_status.BREAKED;
        const newLiveSession = await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: currUser.id,
          status: statusFrom,
        });

        expect(newLiveSession).toBeDefined();

        const res = await request(server)
          .put(`/sessions/live/${newLiveSession.id}/status`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            status: statusTo,
          });

        expect(res.status).toEqual(400);

        const liveSession = await prismaClient.live_session.findFirst({
          where: {
            id: newLiveSession.id,
          },
        });

        expect(liveSession?.status).toEqual(statusFrom);
      });

      test('Response_400_With_Status_Ready_To_Closed', async () => {
        const statusTo = live_session_status.CLOSED;

        const newLiveSession = await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: currUser.id,
          status: statusFrom,
        });

        expect(newLiveSession).toBeDefined();

        const res = await request(server)
          .put(`/sessions/live/${newLiveSession.id}/status`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            status: statusTo,
          });

        expect(res.status).toEqual(400);

        const liveSession = await prismaClient.live_session.findFirst({
          where: {
            id: newLiveSession.id,
          },
        });

        expect(liveSession?.status).toEqual(statusFrom);
      });
    });

    describe('Opened To', () => {
      const statusFrom = live_session_status.OPENED;

      test('Response_200_With_Status_Opened_To_Breaked', async () => {
        const statusTo = live_session_status.BREAKED;

        const newLiveSession = await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: currUser.id,
          status: statusFrom,
        });

        expect(newLiveSession).toBeDefined();

        const res = await request(server)
          .put(`/sessions/live/${newLiveSession.id}/status`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            status: statusTo,
          });

        expect(res.status).toEqual(200);

        const liveSession = await prismaClient.live_session.findFirst({
          where: {
            id: newLiveSession.id,
          },
        });

        expect(liveSession?.status).toEqual(statusTo);

        const transitionLog =
          await prismaClient.live_session_transition_log.findFirst({
            where: {
              live_session_id: newLiveSession.id,
            },
          });

        expect(transitionLog?.from_state).toEqual(live_session_status.OPENED);
        expect(transitionLog?.to_state).toEqual(live_session_status.BREAKED);
      });

      test('Response_200_With_Status_Opened_To_Closed', async () => {
        const statusTo = live_session_status.CLOSED;

        const newLiveSession = await createTestLiveSession({
          status: statusFrom,
        });

        expect(newLiveSession).toBeDefined();

        const res = await request(server)
          .put(`/sessions/live/${newLiveSession.id}/status`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            status: statusTo,
          });

        expect(res.status).toEqual(200);

        const liveSession = await prismaClient.live_session.findFirst({
          where: {
            id: newLiveSession.id,
          },
        });

        expect(liveSession?.status).toEqual(statusTo);

        const transitionLog =
          await prismaClient.live_session_transition_log.findFirst({
            where: {
              live_session_id: newLiveSession.id,
            },
          });

        expect(transitionLog?.from_state).toEqual(live_session_status.OPENED);
        expect(transitionLog?.to_state).toEqual(live_session_status.CLOSED);
      });

      test('Response_400_With_Status_Opened_To_Ready', async () => {
        const statusTo = live_session_status.READY;

        const newLiveSession = await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: currUser.id,
          status: statusFrom,
        });

        expect(newLiveSession).toBeDefined();

        const res = await request(server)
          .put(`/sessions/live/${newLiveSession.id}/status`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            status: statusTo,
          });

        expect(res.status).toEqual(400);

        const liveSession = await prismaClient.live_session.findFirst({
          where: {
            id: newLiveSession.id,
          },
        });

        expect(liveSession?.status).toEqual(statusFrom);
      });
    });

    describe('Closed To', () => {
      const statusFrom = live_session_status.CLOSED;

      test('Response_400_With_Status_Closed_To_Ready', async () => {
        const statusTo = live_session_status.READY;

        const newLiveSession = await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: currUser.id,
          status: statusFrom,
        });

        expect(newLiveSession).toBeDefined();

        const res = await request(server)
          .put(`/sessions/live/${newLiveSession.id}/status`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            status: statusTo,
          });

        expect(res.status).toEqual(400);

        const liveSession = await prismaClient.live_session.findFirst({
          where: {
            id: newLiveSession.id,
          },
        });

        expect(liveSession?.status).toEqual(statusFrom);
      });

      test('Response_400_With_Status_Closed_To_Opened', async () => {
        const statusTo = live_session_status.OPENED;

        const newLiveSession = await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: currUser.id,
          status: statusFrom,
        });

        expect(newLiveSession).toBeDefined();

        const res = await request(server)
          .put(`/sessions/live/${newLiveSession.id}/status`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            status: statusTo,
          });

        expect(res.status).toEqual(400);

        const liveSession = await prismaClient.live_session.findFirst({
          where: {
            id: newLiveSession.id,
          },
        });

        expect(liveSession?.status).toEqual(statusFrom);
      });

      test('Response_400_With_Status_Closed_To_Breaked', async () => {
        const statusTo = live_session_status.BREAKED;

        const newLiveSession = await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: currUser.id,
          status: statusFrom,
        });

        expect(newLiveSession).toBeDefined();

        const res = await request(server)
          .put(`/sessions/live/${newLiveSession.id}/status`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            status: statusTo,
          });

        expect(res.status).toEqual(400);

        const liveSession = await prismaClient.live_session.findFirst({
          where: {
            id: newLiveSession.id,
          },
        });

        expect(liveSession?.status).toEqual(statusFrom);
      });
    });

    describe('Breaked To', () => {
      const statusFrom = live_session_status.BREAKED;

      test('Response_200_With_Status_Breaked_To_Closed', async () => {
        const statusTo = live_session_status.CLOSED;

        const newLiveSession = await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: currUser.id,
          status: statusFrom,
        });

        expect(newLiveSession).toBeDefined();

        const res = await request(server)
          .put(`/sessions/live/${newLiveSession.id}/status`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            status: statusTo,
          });

        expect(res.status).toEqual(200);

        const liveSession = await prismaClient.live_session.findFirst({
          where: {
            id: newLiveSession.id,
          },
        });

        expect(liveSession?.status).toEqual(statusTo);

        const transitionLog =
          await prismaClient.live_session_transition_log.findFirst({
            where: {
              live_session_id: newLiveSession.id,
            },
          });

        expect(transitionLog?.from_state).toEqual(live_session_status.BREAKED);
        expect(transitionLog?.to_state).toEqual(live_session_status.CLOSED);
      });

      test('Response_200_With_Status_Breaked_To_Opened', async () => {
        const statusTo = live_session_status.OPENED;

        const newLiveSession = await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: currUser.id,
          status: statusFrom,
        });

        expect(newLiveSession).toBeDefined();

        const res = await request(server)
          .put(`/sessions/live/${newLiveSession.id}/status`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            status: statusTo,
          });

        expect(res.status).toEqual(200);

        const liveSession = await prismaClient.live_session.findFirst({
          where: {
            id: newLiveSession.id,
          },
        });

        expect(liveSession?.status).toEqual(statusTo);

        const transitionLog =
          await prismaClient.live_session_transition_log.findFirst({
            where: {
              live_session_id: newLiveSession.id,
            },
          });

        expect(transitionLog?.from_state).toEqual(live_session_status.BREAKED);
        expect(transitionLog?.to_state).toEqual(live_session_status.OPENED);
      });

      test('Response_400_With_Status_Breaked_To_Ready', async () => {
        const statusTo = live_session_status.READY;

        const newLiveSession = await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: currUser.id,
          status: statusFrom,
        });

        expect(newLiveSession).toBeDefined();

        const res = await request(server)
          .put(`/sessions/live/${newLiveSession.id}/status`)
          .set('Content-Type', 'application/x-www-form-urlencoded')
          .send({
            status: statusTo,
          });

        expect(res.status).toEqual(400);

        const liveSession = await prismaClient.live_session.findFirst({
          where: {
            id: newLiveSession.id,
          },
        });

        expect(liveSession?.status).toEqual(statusFrom);
      });
    });

    // live session status 변경 요청에 status가 지정되지 않으면 400을 응답받아야한다.
    test('Response_400_status(x)', async () => {
      const liveSession = await createTestLiveSession({
        access_level: access_level.PUBLIC,
        organizer_id: currUser.id,
        status: live_session_status.READY,
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
        access_level: access_level.PUBLIC,
        organizer_id: organizer.id,
        status: live_session_status.READY,
      });

      expect(liveSession).toBeDefined();

      const res = await request(server)
        .put(`/sessions/live/${liveSession.id}/status`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          status: live_session_status.OPENED,
        });

      expect(res.statusCode).toEqual(403);
    });
  });
});
