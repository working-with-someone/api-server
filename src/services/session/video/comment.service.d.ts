type SessionType = 'live' | 'video';
type commentSortKeyword = 'recent';
import { Prisma } from '@prisma/client';
export interface GetCommentInput {
  comment: Prisma.video_session_commentGetPayload<false>;
}

export interface GetCommentsInput {
  videoSessionId: string;
  page: number;
  per_page: number;
  sort: string;
}

export interface CreateCommentInput {
  userId: number;

  videoSessionId: string;
  content: string;
}

export interface DeleteCommentInput {
  comment_id: bigint;

  videoSessionId: string;
  currUserId: number;
}
