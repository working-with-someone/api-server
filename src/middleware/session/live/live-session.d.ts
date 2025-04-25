import type { Prisma } from '@prisma/client';

export type AttachedLiveSession = Prisma.live_sessionGetPayload<{
  omit: {
    stream_key: true;
  };
}>;
