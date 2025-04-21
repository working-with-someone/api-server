import { Prisma } from '@prisma/client';
import { PagiNationData } from '../../pagination';

export interface GetLiveSessionsInput extends PagiNationData {
  userId: number;
}

export type AttachedLiveSession = Prisma.live_sessionGetPayload<{
  omit: {
    stream_key: true;
  };
}>;

export interface createSessionInput
  extends Pick<
    Prisma.live_sessionCreateInput,
    'title' | 'description' | 'category' | 'access_level'
  > {
  userId: number;
  thumbnail?: Express.Multer.File;
}
