import { Prisma } from '@prisma/client';
import type { File } from '../middleware/minions';

declare namespace user {
  interface PublicUserInfo {
    id: number;
    username: string;
    pfp: string;
    email: string;
  }

  interface updateUserInput extends Pick<Prisma.userUpdateInput, 'username'> {
    pfp?: File;
  }
}
