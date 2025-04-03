import { createRequest, createResponse } from 'node-mocks-http';
import prismaClient from '../../../../src/database/clients/prisma';
jest.unmock('../../../../src/database/clients/prisma.ts');
import testUserData from '../../../data/user.json';
import liveSessionMiddleware from '../../../../src/middleware/session/live';
import currUser from '../../../data/curr-user';
import { createTestLiveSession } from '../../../data/live-session';
import { accessLevel } from '../../../../src/enums/session';
import { live_session_status } from '@prisma/client';

// must mocking next function which accpet err argument but do nothing
const mockNext = jest.fn((err) => err);

describe('session middleware', () => {
  describe('ownerOrForbidden ', () => {
    beforeAll(async () => {
      await currUser.insert();

      for (const user of testUserData.users) {
        await prismaClient.user.create({
          data: { ...user, pfp: { create: {} } },
        });
      }
    });

    afterAll(async () => {
      await prismaClient.user.deleteMany({});
      await prismaClient.live_session.deleteMany({});
    });

    test('Next_Function_Should_Called_Without_Error_If_Onwer', async () => {
      const liveSession = await createTestLiveSession({
        access_level: accessLevel.public,
        organizer_id: currUser.id,
        status: live_session_status.READY,
      });

      expect(liveSession).toBeDefined();

      const req = createRequest({
        params: { live_session_id: liveSession!.id },
        session: {
          userId: currUser.id,
        },
      });

      const res = createResponse({
        locals: {
          liveSession,
        },
      });

      await liveSessionMiddleware.checkOwnerOrForbidden(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      // must be called without error
      expect(mockNext.mock.calls[0][0]).toBeUndefined();
    });

    test('Next_Function_Should_Called_With_Error_If_Not_Owner', async () => {
      const liveSession_1 = await createTestLiveSession({
        access_level: accessLevel.public,
        organizer_id: currUser.id,
        status: live_session_status.READY,
      });

      const participant = testUserData.users[1];

      const liveSession_2 = await prismaClient.live_session.findFirst({
        where: {
          organizer_id: currUser.id,
        },
      });

      expect(liveSession_2).toBeDefined();

      const req = createRequest({
        params: { live_session_id: liveSession_2?.id },
        session: {
          userId: participant.id,
        },
      });

      const res = createResponse({
        locals: {
          session: liveSession_2,
        },
      });

      await liveSessionMiddleware.checkOwnerOrForbidden(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);

      expect(mockNext.mock.calls[0][0]).toBeDefined();
    });
  });
});
