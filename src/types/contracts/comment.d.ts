import type { Prisma } from '../../../prisma/generated/prisma/client';

export type PublicVideoSessionComment = Prisma.video_session_commentGetPayload<{
  include: {
    user: {
      include: {
        pfp: true;
      };
    };
    video_session: true;
  };
}>;

export type PublicVideoSessionCommentWithIsLiked = PublicVideoSessionComment & {
  isLiked: boolean;
};

