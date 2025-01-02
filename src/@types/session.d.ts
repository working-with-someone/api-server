import { Prisma } from '@prisma/client';
import { liveSessionStatus } from '../enums/session';

export interface getSessionInput extends Pick<Prisma.sessionWhereInput, 'id'> {
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
  sessionId: string;
  status: liveSessionStatus;
}
