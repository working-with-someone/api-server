import { Prisma } from '@prisma/client';
import { liveSessionStatus } from '../enums/session';

export interface isAllowedToSessionInput {
  session: Prisma.sessionGetPayload<{
    include: { session_live: true };
  }>;
  userId: number;
}

export interface getSessionInput {
  session: Prisma.sessionGetPayload<{
    include: { session_live: true };
  }>;
  userId: number;
}

export interface createSessionInput
  extends Pick<
    Prisma.sessionCreateInput,
    'title' | 'description' | 'category' | 'access_level'
  > {
  userId: number;
  thumbnail?: Express.Multer.File;
}

export interface updateLiveSessionStatus {
  session: Prisma.sessionGetPayload<{
    include: { session_live: true };
  }>;
  status: liveSessionStatus;
}
