import type { Prisma } from '../../../prisma/generated/prisma/client';

export type PublicFollowing = Prisma.followGetPayload<{
  include: {
    following: {
      include: {
        pfp: true;
      };
    };
  };
}>;

export type PublicFollower = Prisma.followGetPayload<{
  include: {
    follower: {
      include: {
        pfp: true;
      };
    };
  };
}>;

