import { Prisma } from '@prisma/client';

export type AttachedLiveSession = Prisma.live_sessionGetPayload<true>;

export interface createSessionInput
  extends Pick<
    Prisma.live_sessionCreateInput,
    'title' | 'description' | 'category' | 'access_level'
  > {
  userId: number;
  thumbnail?: Express.Multer.File;
}
