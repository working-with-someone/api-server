import { Prisma } from '@prisma/client';

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
      session: Prisma.sessionGetPayload<{
        include: { session_live: true };
      }>;

      user: Prisma.userGetPayload<false>;
      following: Prisma.followGetPayload<false>;
    }
  }
}
