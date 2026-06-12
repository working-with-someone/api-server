import prismaClient from '../../../database/clients/prisma';
import { GetVideoSessionLikeInput } from './like.service.d';

async function getVideoSessionLike(input: GetVideoSessionLikeInput) {
  return input.like;
}

const videoSessionLikeService = {
  getVideoSessionLike,
};

export default videoSessionLikeService;
