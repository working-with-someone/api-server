import prismaClient from '../../../../src/database/clients/prisma';
import request from 'supertest';
import server from '../../../../src';
import currUser from '../../../data/curr-user';
import { live_session_status, access_level, category } from '@prisma/client';
import httpStatusCode from 'http-status-codes';
import { userFactory, liveSessionFactory } from '../../../factories';
import { user } from '@prisma/client';
import fs from 'node:fs';
import categoryFactory from '../../../factories/category-factory';

describe('Live Session API', () => {
  let user1: user;

  beforeAll(async () => {
    user1 = await userFactory.createAndSave();
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /sessions/live/:live_session_id', () => {
    afterEach(async () => {
      await prismaClient.live_session.deleteMany({});
      await prismaClient.follow.deleteMany({});
      await prismaClient.live_session_allow.deleteMany({});
    });

    describe('Public Session', () => {
      // public session은 authenticated user 모두가 가져올 수 있다.
      test('Response_200_With_Public_Live_Session', async () => {
        const liveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.PUBLIC,
          organizer: {
            connect: { id: user1.id },
          },
          status: live_session_status.OPENED,
        });

        const res = await request(server).get(
          `/sessions/live/${liveSession.id}`
        );

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveProperty('organizer_id', user1.id);
        // stream key는 숨겨져 있어야한다.
        expect(res.body.data.stream_key).toBeUndefined();
      });
    });

    describe('Follower Only Session', () => {
      // user2가 생성한 follower only session을 follower인 사람은 가져올 수 있다.'
      test('Response_200_With_Follower_Only_Live_Session', async () => {
        const liveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.FOLLOWER_ONLY,
          organizer: {
            connect: { id: user1.id },
          },
          status: live_session_status.OPENED,
        });

        await prismaClient.follow.create({
          data: {
            follower_user_id: currUser.id,
            following_user_id: user1.id,
          },
        });

        const res = await request(server).get(
          `/sessions/live/${liveSession.id}`
        );

        expect(res.statusCode).toEqual(200);
        expect(res.body.data).toHaveProperty('organizer_id', user1.id);
        // stream key는 숨겨져 있어야한다.
        expect(res.body.data.stream_key).toBeUndefined();
      });

      test('Response_403', async () => {
        const liveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.FOLLOWER_ONLY,
          organizer: {
            connect: { id: user1.id },
          },
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
        const liveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.PRIVATE,
          organizer: {
            connect: { id: user1.id },
          },
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
        expect(res.body.data).toHaveProperty('organizer_id', user1.id);
      });

      test('Response_403', async () => {
        const liveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.PRIVATE,
          organizer: {
            connect: { id: user1.id },
          },
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
    beforeAll(async () => {
      // other user's public live session
      await liveSessionFactory.createManyAndSave({
        count: 2,
        overrides: {
          access_level: access_level.PUBLIC,
          organizer: {
            connect: { id: user1.id },
          },
          status: live_session_status.OPENED,
        },
      });

      // other user's private live session
      await liveSessionFactory.createManyAndSave({
        count: 2,
        overrides: {
          access_level: access_level.FOLLOWER_ONLY,
          organizer: {
            connect: { id: user1.id },
          },
          status: live_session_status.OPENED,
        },
      });

      await liveSessionFactory.createManyAndSave({
        count: 2,
        overrides: {
          access_level: access_level.PUBLIC,
          organizer: {
            connect: { id: currUser.id },
          },
          status: live_session_status.OPENED,
        },
      });

      await liveSessionFactory.createManyAndSave({
        count: 2,
        overrides: {
          access_level: access_level.FOLLOWER_ONLY,
          organizer: {
            connect: { id: currUser.id },
          },
          status: live_session_status.OPENED,
        },
      });

      await liveSessionFactory.createManyAndSave({
        count: 2,
        overrides: {
          access_level: access_level.PRIVATE,
          organizer: {
            connect: { id: currUser.id },
          },
          status: live_session_status.OPENED,
        },
      });
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
            following_user_id: user1.id,
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
            following_user_id: user1.id,
          },
        });

        await liveSessionFactory.createManyAndSave({
          count: 2,
          overrides: {
            access_level: access_level.FOLLOWER_ONLY,
            organizer: {
              connect: { id: user1.id },
            },
            status: live_session_status.OPENED,
            allow: {
              createMany: {
                data: {
                  user_id: currUser.id,
                },
              },
            },
          },
        });
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
      const newLiveSession = liveSessionFactory.create();

      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', newLiveSession.title)
        .field('description', newLiveSession.description!)
        .field('category', 'test')
        .field('access_level', access_level.PUBLIC)
        .attach(
          'thumbnail',
          fs.createReadStream('./tests/data/images/image.png')
        );

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
      const newLiveSession = liveSessionFactory.create();

      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', newLiveSession.title)
        .field('description', newLiveSession.description!)
        .field('category', 'test')
        .field('access_level', access_level.PUBLIC);

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty('organizer_id', currUser.id);
      // stream key는 숨겨져 있어야한다.
      expect(res.body.data.stream_key).toBeUndefined();
    });

    test('Response_201_With_Public_Live_Session', async () => {
      const newLiveSession = liveSessionFactory.create();

      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', newLiveSession.title)
        .field('description', newLiveSession.description!)
        .field('category', 'test')
        .field('access_level', access_level.PUBLIC)
        .attach(
          'thumbnail',
          fs.createReadStream('./tests/data/images/image.png')
        );

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
      const newLiveSession = liveSessionFactory.create();

      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', newLiveSession.title)
        .field('description', newLiveSession.description!)
        .field('category', 'test')
        .field('access_level', access_level.PRIVATE);

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toHaveProperty('organizer_id', currUser.id);
      // stream key는 숨겨져 있어야한다.
      expect(res.body.data.stream_key).toBeUndefined();
    });

    test('Response_400_With_access_level(?)', async () => {
      const newLiveSession = liveSessionFactory.create();

      const res = await request(server)
        .post('/sessions/live')
        .set('Content-Type', 'multipart/form-data')
        .field('title', newLiveSession.title)
        .field('description', newLiveSession.description!)
        .field('category', 'test')
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

        const newLiveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.PUBLIC,
          organizer: {
            connect: { id: currUser.id },
          },
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
        const newLiveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.PUBLIC,
          organizer: {
            connect: { id: currUser.id },
          },
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

        const newLiveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.PUBLIC,
          organizer: {
            connect: { id: currUser.id },
          },
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

        const newLiveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.PUBLIC,
          organizer: {
            connect: { id: currUser.id },
          },
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

        const newLiveSession = await liveSessionFactory.createAndSave({
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

        const newLiveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.PUBLIC,
          organizer: {
            connect: { id: currUser.id },
          },
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

        const newLiveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.PUBLIC,
          organizer: {
            connect: { id: currUser.id },
          },
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

        const newLiveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.PUBLIC,
          organizer: {
            connect: { id: currUser.id },
          },
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

        const newLiveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.PUBLIC,
          organizer: {
            connect: { id: currUser.id },
          },
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

        const newLiveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.PUBLIC,
          organizer: {
            connect: { id: currUser.id },
          },
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

        const newLiveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.PUBLIC,
          organizer: {
            connect: { id: currUser.id },
          },
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

        const newLiveSession = await liveSessionFactory.createAndSave({
          access_level: access_level.PUBLIC,
          organizer: {
            connect: { id: currUser.id },
          },
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
      const liveSession = await liveSessionFactory.createAndSave({
        access_level: access_level.PUBLIC,
        organizer: {
          connect: { id: currUser.id },
        },
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
      const organizer = user1;

      const liveSession = await liveSessionFactory.createAndSave({
        access_level: access_level.PUBLIC,
        organizer: {
          connect: { id: organizer.id },
        },
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
