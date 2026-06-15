import prismaClient from '../../../database/clients/prisma';
import {
  GetVideoSessionLikeInput,
  CreateVideoSessionLikeInput,
  DeleteVideoSessionLikeInput,
} from './like.service.d';

async function getVideoSessionLike(input: GetVideoSessionLikeInput) {
  return input.like;
}

async function createVideoSessionLike(input: CreateVideoSessionLikeInput) {
  const createdLike = await prismaClient.video_session_like.create({
    data: {
      user_id: input.userId,
      video_session_id: input.videoSessionId,
    },
  });

  return createdLike;
}

async function deleteVideoSessionLike(input: DeleteVideoSessionLikeInput) {
  const deletedLike = await prismaClient.video_session_like.delete({
    where: {
      user_id_video_session_id: {
        user_id: input.userId,
        video_session_id: input.videoSessionId,
      },
    },
  });

  return deletedLike;
}

const videoSessionLikeService = {
  getVideoSessionLike,
  createVideoSessionLike,
  deleteVideoSessionLike,
};

export default videoSessionLikeService;
