import { Prisma } from '@prisma/client';

interface UpdateUserInput extends Pick<Prisma.userUpdateInput, 'username'> {
  pfp?: Express.Multer.File;
  pfpToDefault?: boolean;
}
