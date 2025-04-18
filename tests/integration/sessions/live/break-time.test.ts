import prismaClient from '../../../../src/database/clients/prisma';
jest.unmock('../../../../src/database/clients/prisma.ts');
import request from 'supertest';
import server from '../../../../src';
import testUserData from '../../../data/user.json';
import { live_session_status, access_level } from '@prisma/client';
import currUser from '../../../data/curr-user';
import {
  createTestLiveSession,
  sampleBreakTimeFields,
} from '../../../data/live-session';

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

  describe('POST /sessions/live/:live_session_id/break_time', () => {
    afterEach(async () => {
      await prismaClient.live_session_break_time.deleteMany({});
      await prismaClient.live_session.deleteMany({});
    });

    test('Response_201_With_Break_Time', async () => {
      const liveSession = await createTestLiveSession({
        access_level: access_level.PUBLIC,
        organizer_id: currUser.id,
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

    test('Response_401', async () => {
      const liveSession = await createTestLiveSession({
        access_level: access_level.PUBLIC,
        organizer_id: testUserData.users[1].id,
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
      const liveSession = await createTestLiveSession({
        access_level: access_level.PUBLIC,
        organizer_id: currUser.id,
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
      const liveSession = await createTestLiveSession({
        access_level: access_level.PUBLIC,
        organizer_id: currUser.id,
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
      const liveSession = await createTestLiveSession({
        access_level: access_level.PUBLIC,
        organizer_id: currUser.id,
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
    let hardLiveSession;
    let softLiveSession;
    let otherUserHardLiveSession;
    let otherUserSoftLiveSession;

    beforeAll(async () => {
      hardLiveSession = await createTestLiveSession({
        access_level: access_level.PUBLIC,
        organizer_id: currUser.id,
        status: live_session_status.OPENED,
      });

      softLiveSession = await createTestLiveSession({
        access_level: access_level.PUBLIC,
        organizer_id: currUser.id,
        status: live_session_status.OPENED,
        break_time: sampleBreakTimeFields,
      });

      otherUserHardLiveSession = await createTestLiveSession({
        access_level: access_level.PUBLIC,
        organizer_id: testUserData.users[1].id,
        status: live_session_status.OPENED,
      });

      otherUserSoftLiveSession = await createTestLiveSession({
        access_level: access_level.PUBLIC,
        organizer_id: testUserData.users[1].id,
        status: live_session_status.OPENED,
        break_time: sampleBreakTimeFields,
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
      expect(res.body.data).toMatchObject(sampleBreakTimeFields);
    });

    test('Response_200_With_Other_User_LiveSession_Break_Time', async () => {
      const res = await request(server).get(
        `/sessions/live/${otherUserSoftLiveSession!.id}/break_time`
      );

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toMatchObject(sampleBreakTimeFields);
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
