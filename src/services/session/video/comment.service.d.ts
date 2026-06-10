type SessionType = 'live' | 'video';
type commentSortKeyword = 'recent';

export interface GetCommentInput {
  comment_id: number;
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
