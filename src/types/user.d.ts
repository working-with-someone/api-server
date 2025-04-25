import { Prisma } from '@prisma/client';

declare namespace user {
  interface PublicUserInfo {
    id: number;
    username: string;
    pfp: string;
    email: string;
  }
}
