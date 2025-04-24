import prismaClient from '../../../../src/database/clients/prisma';
import request from 'supertest';
import server from '../../../../src';
import {
  live_session_status,
  access_level,
  user,
  live_session,
} from '@prisma/client';
import currUser from '../../../data/curr-user';
import { userFactory, liveSessionFactory } from '../../../factories';
import { LiveSessionWithAll } from '../../../factories/live-session-factory';

describe('Live Session API', () => {
  let user1: user;

  beforeAll(async () => {
    user1 = await userFactory.createAndSave();
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('POST /sessions/live/:live_session_id/break_time', () => {
    afterEach(async () => {
      await prismaClient.live_session_break_time.deleteMany({});
      await prismaClient.live_session.deleteMany({});
    });

    test('Response_201_With_Break_Time', async () => {
      const liveSession = await liveSessionFactory.createAndSave({
        access_level: access_level.PUBLIC,
        organizer: {
          connect: {
            id: currUser.id,
          },
        },
        status: live_session_status.OPENED,
      });

      const res = await request(server)
        .post(`/sessions/live/${liveSession.id}/break_time`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          interval: 50,
          duration: 10,
        });

      expect(res.statusCode).toEqual(201);
    });

    // 존재하지 않는 live session에 break time을 생성하려는 요청은 404를 응답받아야한다.
    test('Response_404', async () => {
      const res = await request(server)
        .post(`/sessions/live/doesNotExistLiveSession/break_time`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          interval: 50,
          duration: 10,
        });

      expect(res.statusCode).toEqual(404);
    });

    // 다른 사용자의 live session에 break time을 생성하려는 요청은 401을 응답받아야한다.
    test('Response_401', async () => {
      const liveSession = await liveSessionFactory.createAndSave({
        access_level: access_level.PUBLIC,
        organizer: {
          connect: {
            id: user1.id,
          },
        },
        status: live_session_status.OPENED,
      });

      const res = await request(server)
        .post(`/sessions/live/${liveSession.id}/break_time`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          interval: 50,
          duration: 10,
        });

      expect(res.statusCode).toEqual(403);
    });

    test('Response_400_Interval(x)', async () => {
      const liveSession = await liveSessionFactory.createAndSave({
        access_level: access_level.PUBLIC,
        organizer: {
          connect: {
            id: currUser.id,
          },
        },
        status: live_session_status.OPENED,
      });

      const res = await request(server)
        .post(`/sessions/live/${liveSession.id}/break_time`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          duration: 10,
        });

      expect(res.statusCode).toEqual(400);
    });

    test('Response_400_Duration(x)', async () => {
      const liveSession = await liveSessionFactory.createAndSave({
        access_level: access_level.PUBLIC,
        organizer: {
          connect: {
            id: currUser.id,
          },
        },
        status: live_session_status.OPENED,
      });

      const res = await request(server)
        .post(`/sessions/live/${liveSession.id}/break_time`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({
          interval: 50,
        });

      expect(res.statusCode).toEqual(400);
    });

    test('Response_400_Interval(x)_Duration(x)', async () => {
      const liveSession = await liveSessionFactory.createAndSave({
        access_level: access_level.PUBLIC,
        organizer: {
          connect: {
            id: currUser.id,
          },
        },
        status: live_session_status.OPENED,
      });

      const res = await request(server)
        .post(`/sessions/live/${liveSession.id}/break_time`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({});

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET /sessions/live/:live_session_id/break_time', () => {
    let hardLiveSession: LiveSessionWithAll;
    let softLiveSession: LiveSessionWithAll;
    let otherUserHardLiveSession: LiveSessionWithAll;
    let otherUserSoftLiveSession: LiveSessionWithAll;

    beforeAll(async () => {
      hardLiveSession = await liveSessionFactory.createAndSave({
        access_level: access_level.PUBLIC,
        organizer: {
          connect: {
            id: currUser.id,
          },
        },
        status: live_session_status.OPENED,
      });

      softLiveSession = await liveSessionFactory.createAndSave({
        access_level: access_level.PUBLIC,
        organizer: {
          connect: {
            id: currUser.id,
          },
        },
        status: live_session_status.OPENED,
        break_time: {
          create: {
            duration: 10,
            interval: 50,
          },
        },
      });

      otherUserHardLiveSession = await liveSessionFactory.createAndSave({
        access_level: access_level.PUBLIC,
        organizer: {
          connect: {
            id: user1.id,
          },
        },
        status: live_session_status.OPENED,
      });

      otherUserSoftLiveSession = await liveSessionFactory.createAndSave({
        organizer: {
          connect: {
            id: user1.id,
          },
        },
        status: live_session_status.OPENED,
        break_time: {
          create: {
            duration: 10,
            interval: 50,
          },
        },
      });
    });

    afterAll(async () => {
      await prismaClient.live_session.deleteMany({});
    });

    test('Response_200_With_Break_Time', async () => {
      const res = await request(server).get(
        `/sessions/live/${softLiveSession!.id}/break_time`
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toMatchObject(softLiveSession.break_time!);
    });

    test('Response_200_With_Other_User_LiveSession_Break_Time', async () => {
      const res = await request(server).get(
        `/sessions/live/${otherUserSoftLiveSession!.id}/break_time`
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toMatchObject(otherUserSoftLiveSession.break_time!);
    });

    test('Response_204_With_Break_Time', async () => {
      const res = await request(server).get(
        `/sessions/live/${hardLiveSession!.id}/break_time`
      );

      expect(res.statusCode).toEqual(204);
    });

    test('Response_204_With_Other_User_LiveSession_Break_Time', async () => {
      const res = await request(server).get(
        `/sessions/live/${otherUserHardLiveSession!.id}/break_time`
      );

      expect(res.statusCode).toEqual(204);
    });
  });
});
