import prismaClient from '../../../../database/clients/prisma';
import type {
  GetVideoSessionCommentLikeInput,
  CreateVideoSessionCommentLikeInput,
  DeleteVideoSessionCommentLikeInput,
} from './like.d.ts';

export async function getVideoSessionCommentLike(
  input: GetVideoSessionCommentLikeInput
) {
  return input.like;
}

export async function createVideoSessionCommentLike(
  input: CreateVideoSessionCommentLikeInput
) {
  const [createdCommentLike] = await prismaClient.$transaction([
    prismaClient.video_session_comment_like.create({
      data: {
        user_id: input.userId,
        video_session_comment_id: input.commentId,
      },
    }),
    prismaClient.video_session_comment.update({
      where: {
        id: input.commentId,
      },
      data: {
        like_count: {
          increment: 1,
        },
      },
    }),
  ]);

  return createdCommentLike;
}

export async function deleteVideoSessionCommentLike(
  input: DeleteVideoSessionCommentLikeInput
) {
  const [deletedCommentLike] = await prismaClient.$transaction([
    prismaClient.video_session_comment_like.delete({
      where: {
        user_id_video_session_comment_id: {
          user_id: input.userId,
          video_session_comment_id: input.commentId,
        },
      },
    }),
    prismaClient.video_session_comment.update({
      where: {
        id: input.commentId,
      },
      data: {
        like_count: {
          decrement: 1,
        },
      },
    }),
  ]);

  return deletedCommentLike;
}
