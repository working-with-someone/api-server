type SessionType = 'live' | 'video';
type commentSortKeyword = 'recent';
import { Prisma } from '@prisma/client';
export interface GetCommentInput {
  comment: Prisma.commentGetPayload<false>;
}

export interface GetCommentsInput {
  sessionType: SessionType;
  sessionId: string;
  page: number;
  per_page: number;
  sort: string;
}

export interface CreateCommentInput {
  userId: number;
  sessionType: SessionType;
  sessionId: string;
  content: string;
}
