import type { Prisma } from '../../../prisma/generated/prisma/client';

export type PublicVideoSession = Prisma.video_sessionGetPayload<{
  include: {
    break_time: true;
    category: true;
    organizer: {
      include: {
        pfp: true;
      };
    };
  };
}>;

