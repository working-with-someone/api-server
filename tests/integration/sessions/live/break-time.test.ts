import prismaClient from '../../../../src/database/clients/prisma';
jest.unmock('../../../../src/database/clients/prisma.ts');
import request from 'supertest';
import server from '../../../../src';
import testUserData from '../../../data/user.json';
import { accessLevel, liveSessionStatus } from '../../../../src/enums/session';
import currUser from '../../../data/curr-user';
import { createTestLiveSession } from '../../../data/live-session';

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
      await prismaClient.break_time.deleteMany({});
      await prismaClient.live_session.deleteMany({});
    });

    test('Response_201_With_Break_Time', async () => {
      const liveSession = await createTestLiveSession({
        access_level: accessLevel.public,
        organizer_id: currUser.id,
        status: liveSessionStatus.opened,
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
        access_level: accessLevel.public,
        organizer_id: testUserData.users[1].id,
        status: liveSessionStatus.opened,
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
        access_level: accessLevel.public,
        organizer_id: currUser.id,
        status: liveSessionStatus.opened,
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
        access_level: accessLevel.public,
        organizer_id: currUser.id,
        status: liveSessionStatus.opened,
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
        access_level: accessLevel.public,
        organizer_id: currUser.id,
        status: liveSessionStatus.opened,
      });

      const res = await request(server)
        .post(`/sessions/live/${liveSession.id}/break_time`)
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send({});

      expect(res.statusCode).toEqual(400);
    });
  });
});
