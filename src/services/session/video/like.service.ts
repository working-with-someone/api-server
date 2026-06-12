import prismaClient from '../../../database/clients/prisma';
import {
  GetVideoSessionLikeInput,
  CreateVideoSessionLikeInput,
} from './like.service.d';

async function getVideoSessionLike(input: GetVideoSessionLikeInput) {
  return input.like;
}

async function createVideoSessionLike(input: CreateVideoSessionLikeInput) {
  const createdLike = await prismaClient.session_like.create({
    data: {
      user_id: input.userId,
      video_session_id: input.videoSessionId,
    },
  });

  return createdLike;
}

const videoSessionLikeService = {
  getVideoSessionLike,
  createVideoSessionLike,
};

export default videoSessionLikeService;
