import { createRequest, createResponse } from 'node-mocks-http';
import prismaClient from '../../../src/database/clients/prisma';
jest.unmock('../../../src/database/clients/prisma.ts');
import testSessionData from '../../data/session.json';
import testUserData from '../../data/user.json';
import { checkOwnerOrForbidden } from '../../../src/middleware/session';

// must mocking next function which accpet err argument but do nothing
const mockNext = jest.fn((err) => err);
const currUser = testUserData.currUser;

describe('session middleware', () => {
  describe('ownerOrForbidden ', () => {
    beforeAll(async () => {
      for (const user of testUserData.users) {
        await prismaClient.user.create({
          data: { ...user, pfp: { create: {} } },
        });
      }

      for (const liveSession of testSessionData.liveSessions) {
        await prismaClient.session.create({
          data: liveSession,
        });
      }
    });

    afterAll(async () => {
      await prismaClient.user.deleteMany({});
      await prismaClient.session.deleteMany({});
    });

    test('Next_Function_Should_Called_Without_Error_If_Onwer', async () => {
      const session = await prismaClient.session.findFirst({
        where: {
          organizer_id: currUser.id,
        },
      });

      expect(session).toBeDefined();

      const req = createRequest({
        params: { live_session_id: session?.id },
        session: {
          userId: currUser.id,
        },
      });

      const res = createResponse({
        locals: {
          session,
        },
      });

      await checkOwnerOrForbidden(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      // must be called without error
      expect(mockNext.mock.calls[0][0]).toBeUndefined();
    });

    test('Next_Function_Should_Called_With_Error_If_Not_Owner', async () => {
      const participant = testUserData.users[1];

      const session = await prismaClient.session.findFirst({
        where: {
          organizer_id: currUser.id,
        },
      });

      expect(session).toBeDefined();

      const req = createRequest({
        params: { live_session_id: session?.id },
        session: {
          userId: participant.id,
        },
      });

      const res = createResponse({
        locals: {
          session,
        },
      });

      await checkOwnerOrForbidden(req, res, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);

      expect(mockNext.mock.calls[0][0]).toBeDefined();
    });
  });
});
