import { Prisma } from '@prisma/client';
import { PagiNationData } from '../../../types/pagination';

export interface GetLiveSessionsInput extends PagiNationData {
  userId: number;
  category: string;
  search: string;
}

export interface createSessionInput
  extends Pick<
    Prisma.live_sessionCreateInput,
    'title' | 'description' | 'access_level'
  > {
  category: string;
  userId: number;
  thumbnail?: Express.Multer.File;
}
