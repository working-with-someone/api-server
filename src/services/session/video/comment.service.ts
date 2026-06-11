import prismaClient from '../../../database/clients/prisma';
import { wwsError } from '../../../utils/wwsError';
import httpStatusCodes from 'http-status-codes';
import {
  CreateCommentInput,
  GetCommentInput,
  GetCommentsInput,
  DeleteCommentInput,
} from './comment.service.d';
import { Prisma } from '@prisma/client';

export async function getComment(input: GetCommentInput) {
  return input.comment;
}

export async function getComments(input: GetCommentsInput) {
  const orderBy: Prisma.commentOrderByWithRelationInput = {};

  if (input.sort === 'recent') {
    orderBy['created_at'] = 'desc';
  }

  const comments = await prismaClient.comment.findMany({
    where: {
      live_session_id: input.sessionType === 'live' ? input.sessionId : null,
      video_session_id: input.sessionType === 'video' ? input.sessionId : null,
    },
    skip: (input.page - 1) * input.per_page,
    take: input.per_page,
    orderBy,
  });

  return comments;
}

export async function deleteComment(input: DeleteCommentInput) {
  const deletedComment = await prismaClient.comment.delete({
    where: {
      id: input.comment_id,
      live_session_id: input.sessionType === 'live' ? input.sessionId : null,
      video_session_id: input.sessionType === 'video' ? input.sessionId : null,
    },
  });

  return deletedComment;
}

export async function createComment(input: CreateCommentInput) {
  const createdCommnet = await prismaClient.comment.create({
    data: {
      content: input.content,
      user_id: input.userId,
      live_session_id: input.sessionType === 'live' ? input.sessionId : null,
      video_session_id: input.sessionType === 'video' ? input.sessionId : null,
    },
  });

  return createdCommnet;
}
