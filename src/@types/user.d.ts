import { Prisma } from '@prisma/client';
import type { UploadedFile } from 'express-fileupload';

declare namespace user {
  interface PublicUserInfo {
    id: number;
    username: string;
    pfp: string;
    email: string;
  }

  // user data 중 update 가능한 정보는 username
  interface updateUserInput extends Pick<Prisma.userUpdateInput, 'username'> {
    pfp?: UploadedFile;
    pfpToDefault?: boolean;
  }
}
