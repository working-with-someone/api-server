import type { Prisma } from '@prisma/client';

export interface GetVideoSessionCommentLikeInput {
  like: Prisma.video_session_comment_likeGetPayload<false>;
}

export interface CreateVideoSessionCommentLikeInput {
  userId: number;
  videoSessionId: string;
  commentId: number;
}

export interface DeleteVideoSessionCommentLikeInput {
  userId: number;
  videoSessionId: string;
  commentId: number;
}
