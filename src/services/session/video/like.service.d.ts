import type { PublicVideoSessionLike } from '../../../types/contracts/like';

export interface GetVideoSessionLikeInput {
  like: PublicVideoSessionLike;
}

export interface CreateVideoSessionLikeInput {
  userId: number;
  videoSessionId: string;
}

export interface DeleteVideoSessionLikeInput {
  userId: number;
  videoSessionId: string;
}
