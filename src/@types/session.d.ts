import { Prisma } from '@prisma/client';

declare namespace session {
  interface getSessionInput extends Pick<Prisma.sessionWhereInput, 'id'> {
    userId: number;
  }

  interface createSessionInput
    extends Pick<
      Prisma.sessionCreateInput,
      'title' | 'description' | 'category' | 'access_level'
    > {
    userId: number;
    thumbnail?: Express.Multer.File;
  }
}
