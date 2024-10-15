import prismaClient from '../database/clients/prisma';
import { wwsError } from '../utils/wwsError';
import httpStatusCode from 'http-status-codes';
import type { createFollow } from '../@types/follow';

export async function createFollow(data: createFollow) {
  const targetUser = await prismaClient.user.findUnique({
    where: {
      id: data.following_user_id,
    },
  });

  if (!targetUser) {
    throw new wwsError(404, 'can not found target user');
  }

  const followExist = await prismaClient.follow.findUnique({
    where: {
      follower_user_id_following_user_id: data,
    },
  });

  if (followExist) {
    throw new wwsError(
      httpStatusCode.CONFLICT,
      `${data.follower_user_id} user already following ${data.following_user_id}`
    );
  }

  const join = await prismaClient.follow.create({
    data,
  });

  return join;
}