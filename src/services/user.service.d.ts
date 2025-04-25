import { Prisma } from '@prisma/client';

// user data 중 update 가능한 정보는 username
interface UpdateUserInput extends Pick<Prisma.userUpdateInput, 'username'> {
  pfp?: Express.Multer.File;
  pfpToDefault?: boolean;
}
