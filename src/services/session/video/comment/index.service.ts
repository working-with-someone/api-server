import prismaClient from '../../../../database/clients/prisma';
import {
  CreateCommentInput,
  GetCommentInput,
  GetCommentsInput,
  DeleteCommentInput,
} from '.';
import { Prisma } from '@prisma/client';
import {
  PublicVideoSessionComment,
  PublicVideoSessionCommentWithIsLiked,
} from '../../../../types/contracts/comment';
import { PaginatedResult } from '../../../../types/pagination';
import { buildPagenationMeta } from '../../../../utils/pagination';

export async function getComment(
  input: GetCommentInput
): Promise<PublicVideoSessionCommentWithIsLiked> {
  const isLiked = await prismaClient.video_session_comment_like.findFirst({
    where: {
      user_id: input.comment.user_id,
      video_session_comment_id: input.comment.id,
    },
  });

  return {
    ...input.comment,
    isLiked: isLiked ? true : false,
  };
}

export async function getComments(
  input: GetCommentsInput
): Promise<
  PaginatedResult<PublicVideoSessionCommentWithIsLiked[], 'comments'>
> {
  const orderBy: Prisma.video_session_commentOrderByWithRelationInput = {};

  if (input.sort === 'recent') {
    orderBy['created_at'] = 'desc';
  }

  const comments = await prismaClient.video_session_comment.findMany({
    where: {
      video_session_id: input.videoSessionId,
    },
    include: {
      user: {
        include: {
          pfp: true,
        },
      },
      video_session: true,
      // user의 해당 comment like 여부
      likes: {
        where: {
          user_id: input.userId,
        },
      },
    },
    skip: (input.page - 1) * input.per_page,
    take: input.per_page + 1,
    orderBy,
  });

  const pagination = buildPagenationMeta(comments, input.page, input.per_page);

  if (pagination.hasMore) {
    comments.pop();
  }

  const commentsWithIsLiked = comments.map(({ likes, ...comment }) => ({
    ...comment,
    isLiked: likes.length > 0,
  }));

  return {
    comments: commentsWithIsLiked,
    pagination,
  };
}

export async function deleteComment(input: DeleteCommentInput) {
  await prismaClient.$transaction([
    prismaClient.video_session_comment.delete({
      where: {
        id: input.comment_id,
        video_session_id: input.videoSessionId,
      },
    }),
    prismaClient.video_session.update({
      where: { id: input.videoSessionId },
      data: { comment_count: { decrement: 1 } },
    }),
  ]);
}

export async function createComment(
  input: CreateCommentInput
): Promise<PublicVideoSessionCommentWithIsLiked> {
  const [createdComment] = await prismaClient.$transaction([
    prismaClient.video_session_comment.create({
      data: {
        content: input.content,
        user_id: input.userId,
        video_session_id: input.videoSessionId,
      },
      include: {
        user: {
          include: {
            pfp: true,
          },
        },
        video_session: true,
      },
    }),
    prismaClient.video_session.update({
      where: { id: input.videoSessionId },
      data: { comment_count: { increment: 1 } },
    }),
  ]);

  return {
    ...createdComment,
    isLiked: false,
  };
}
