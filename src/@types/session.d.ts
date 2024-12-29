import { Prisma } from '@prisma/client';

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
