import { Prisma } from '@prisma/client';
import { PagiNationData } from '../../../types/pagination';
import { live_session_status } from '@prisma/client';

export interface GetLiveSessionsInput extends PagiNationData {
  userId: number;
  category: string;
  search: string;
  status?: live_session_status | live_session_status[];
}

export interface CreateVideoSessionInput
  extends Partial<
    Pick<
      Prisma.video_sessionCreateInput,
      'title' | 'description' | 'access_level' | 'category'
    >
  > {
  video_id: string;
  category_label?: string;
  userId: number;
  thumbnail?: Express.Multer.File;
}
