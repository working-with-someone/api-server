import { Prisma } from '@prisma/client';
import { AttachedLiveSession } from '../../../middleware/session/live/live-session';
import { AttachedBreakTime } from '../../../services/session/live/break-time';

export {};

declare global {
  namespace Express {
    interface Request {
      user: Prisma.userGetPayload<{
        select: {
          id: true;
          username: true;
          email: true;
        };
      }>;
    }

    interface Locals {
      liveSession: AttachedLiveSession;
      breakTime: AttachedBreakTime;
      user: Prisma.userGetPayload<false>;
      following: Prisma.followGetPayload<false>;
    }
  }
}
