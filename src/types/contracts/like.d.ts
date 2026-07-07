import type { Prisma } from '@prisma/client';

export type PublicVideoSessionLike = Prisma.video_session_likeGetPayload<false>;

export type PublicVideoSessionCommentLike =
  Prisma.video_session_comment_likeGetPayload<false>;
