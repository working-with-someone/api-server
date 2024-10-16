import prismaClient from '../database/clients/prisma';
import { wwsError } from '../utils/wwsError';
import httpStatusCode from 'http-status-codes';
import type { createFollow, deleteFollow } from '../@types/follow';

export async function getFollowings(userId: number) {
  const follows = await prismaClient.follow.findMany({
    where: {
      follower_user_id: userId,
    },
  });

  return follows;
}
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

  const follow = await prismaClient.follow.create({
    data,
  });

  return follow;
}

export async function deleteFollow(data: deleteFollow) {
  await prismaClient.follow.delete({
    where: {
      follower_user_id_following_user_id: data,
    },
  });

  return;
}

export async function getFollowers(userId: number) {
  const followers = await prismaClient.follow.findMany({
    where: {
      following_user_id: userId,
    },
    include: { follower: true },
  });

  return followers.map((follow) => follow.follower);
}
