import { createRequest, createResponse } from 'node-mocks-http';
import prismaClient from '../../../../../src/database/clients/prisma';
import liveSessionMiddleware from '../../../../../src/middleware/session/live/live-session.middleware';
import currUser from '../../../../data/curr-user';
import { user } from '@prisma/client';
import UserFactory from '../../../../factories/user-factory';
import { liveSessionFactory } from '../../../../factories';

// must mocking next function which accpet err argument but do nothing
const mockNext = jest.fn((err) => err);

describe('session middleware', () => {
  let user1: user;

  beforeAll(async () => {
    user1 = await UserFactory.createAndSave();
  });

  describe('ownerOrForbidden ', () => {
    afterAll(async () => {
      await prismaClient.live_session.deleteMany({});
    });

    test('Next_Function_Should_Called_Without_Error_If_Onwer', async () => {
      const liveSession = await liveSessionFactory.createAndSave({
        organizer: { connect: { id: currUser.id } },
      });

      expect(liveSession).toBeDefined();

      const req = createRequest({
        params: { live_session_id: liveSession.id },
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
      const participant = user1;

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
