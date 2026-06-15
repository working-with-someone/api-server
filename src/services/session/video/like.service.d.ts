import type { Prisma } from '@prisma/client';

export interface GetVideoSessionLikeInput {
  like: Prisma.video_session_likeGetPayload<false>;
}

export interface CreateVideoSessionLikeInput {
  userId: number;
  videoSessionId: string;
}

export interface DeleteVideoSessionLikeInput {
  userId: number;
  videoSessionId: string;
}
