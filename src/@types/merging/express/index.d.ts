import { Prisma } from '@prisma/client';

export {};

declare global {
  namespace Express {
    interface Locals {
      session: Prisma.sessionGetPayload<{
        include: { session_live: true };
      }>;
    }
  }
}
