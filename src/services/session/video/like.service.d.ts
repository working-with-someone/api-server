import type { Prisma } from '@prisma/client';

export interface GetVideoSessionLikeInput {
  like: Prisma.session_likeGetPayload<false>;
}

export interface CreateVideoSessionLikeInput {
  userId: number;
  videoSessionId: string;
}
