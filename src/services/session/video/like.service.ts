import prismaClient from '../../../database/clients/prisma';
import {
  GetVideoSessionLikeInput,
  CreateVideoSessionLikeInput,
  DeleteVideoSessionLikeInput,
} from './like.service.d';
import { PublicVideoSessionLike } from '../../../types/contracts/like';

async function getVideoSessionLike(
  input: GetVideoSessionLikeInput
): Promise<PublicVideoSessionLike> {
  return input.like;
}

async function createVideoSessionLike(
  input: CreateVideoSessionLikeInput
): Promise<PublicVideoSessionLike> {
  const [createdLike] = await prismaClient.$transaction([
    prismaClient.video_session_like.create({
      data: {
        user_id: input.userId,
        video_session_id: input.videoSessionId,
      },
    }),
    prismaClient.video_session.update({
      where: {
        id: input.videoSessionId,
      },
      data: {
        like_count: {
          increment: 1,
        },
      },
    }),
  ]);

  return createdLike;
}

async function deleteVideoSessionLike(input: DeleteVideoSessionLikeInput) {
  await prismaClient.$transaction([
    prismaClient.video_session_like.delete({
      where: {
        user_id_video_session_id: {
          user_id: input.userId,
          video_session_id: input.videoSessionId,
        },
      },
    }),
    prismaClient.video_session.update({
      where: {
        id: input.videoSessionId,
      },
      data: {
        like_count: {
          decrement: 1,
        },
      },
    }),
  ]);
}

const videoSessionLikeService = {
  getVideoSessionLike,
  createVideoSessionLike,
  deleteVideoSessionLike,
};

export default videoSessionLikeService;
