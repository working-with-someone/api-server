import type { PublicVideoSessionCommentLike } from '../../../../types/contracts/like';

export interface GetVideoSessionCommentLikeInput {
  like: PublicVideoSessionCommentLike;
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
