import type { live_session_status, Prisma } from '@prisma/client';

export type PublicLiveSession = Prisma.live_sessionGetPayload<{
  include: {
    break_time: true;
    category: true;
    live_session_transition_log: true;
    organizer: {
      include: {
        pfp: true;
      };
    };
  };
  omit: {
    stream_key: true;
  };
}>;

export type PrivateLiveASession = Prisma.live_sessionGetPayload<{
  include: {
    break_time: true;
    category: true;
    live_session_transition_log: true;
    organizer: {
      include: {
        pfp: true;
      };
    };
  };
}>;

export type PublicLiveSessionStatus = live_session_status;

export type PublicLiveSessionThumbnailUri = string;
