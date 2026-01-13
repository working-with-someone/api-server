import { Prisma } from '@prisma/client';
import { PagiNationData } from '../../../types/pagination';
import { live_session_status } from '@prisma/client';
export interface GetLiveSessionsInput extends PagiNationData {
  userId: number;
  category: string;
  search: string;
  status?: live_session_status | live_session_status[];
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
