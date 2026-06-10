import prismaClient from '../../../database/clients/prisma';
import { wwsError } from '../../../utils/wwsError';
import httpStatusCodes from 'http-status-codes';
import { GetCommentInput } from './comment.service.d';

export async function getComment(input: GetCommentInput) {
  const comment = await prismaClient.comment.findUnique({
    where: {
      id: input.comment_id,
    },
  });

  if (!comment) {
    throw new wwsError(httpStatusCodes.NOT_FOUND, 'Comment not found');
  }

  return comment;
}
