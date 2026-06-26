import prismaClient from '../../../../database/clients/prisma';
import {
  CreateCommentInput,
  GetCommentInput,
  GetCommentsInput,
  DeleteCommentInput,
} from '.';
import { Prisma } from '@prisma/client';

export async function getComment(input: GetCommentInput) {
  return input.comment;
}

export async function getComments(input: GetCommentsInput) {
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
    },
    skip: (input.page - 1) * input.per_page,
    take: input.per_page,
    orderBy,
  });

  return comments;
}

export async function deleteComment(input: DeleteCommentInput) {
  const transaction: any[] = [
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
  ];

  const [deletedComment] = await prismaClient.$transaction(transaction);

  return deletedComment;
}

export async function createComment(input: CreateCommentInput) {
  const transaction: any[] = [
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
      },
    }),
    prismaClient.video_session.update({
      where: { id: input.videoSessionId },
      data: { comment_count: { increment: 1 } },
    }),
  ];

  const [createdComment] = await prismaClient.$transaction(transaction);

  return createdComment;
}
