import { Prisma } from '@prisma/client';

export type VideoSessionWithAll = Prisma.video_sessionGetPayload<{
  include: {
    organizer: true;
    allow: true;
    break_time: true;
    category: true;
  };
}>;

export type VideoSessionCommentWithAll =
  Prisma.video_session_commentGetPayload<{}>;
