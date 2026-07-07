type SessionType = 'live' | 'video';
type commentSortKeyword = 'recent';
import { PublicVideoSessionComment } from '../../../../types/contracts/comment';

export interface GetCommentInput {
  comment: PublicVideoSessionComment
}

export interface GetCommentsInput {
  userId: number;
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
