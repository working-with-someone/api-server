import prismaClient from '../database/clients/prisma';
import { wwsError } from '../utils/wwsError';
import { PrismaError } from 'prisma-error-enum';
import httpStatusCode from 'http-status-codes';

import type {
  CheckFollowingInput,
  CreateFollowingInput,
  DeleteFollowInput,
  GetFollowersInput,
  GetFollowingInput,
  GetFollowingsInput,
} from '../@types/follow';

import { Prisma } from '@prisma/client';

export async function getFollowing(data: GetFollowingInput) {
  const following = await prismaClient.follow.findUnique({
    where: {
      follower_user_id_following_user_id: data,
    },
  });

  return following;
}

export async function checkFollowing(data: CheckFollowingInput) {
  const follow = await getFollowing(data);

  return follow ? true : false;
}

export async function getFollowings(data: GetFollowingsInput) {
  const follows = await prismaClient.follow.findMany({
    where: {
      follower_user_id: data.userId,
    },
    skip: (data.page - 1) * data.per_page,
    take: data.per_page,
  });

  return follows;
}

export async function createFollowing(data: CreateFollowingInput) {
  const targetUser = await prismaClient.user.findUnique({
    where: {
      id: data.following_user_id,
    },
  });

  if (!targetUser) {
    throw new wwsError(404, 'can not found target user');
  }

  const alreadyFollow = await prismaClient.follow.findUnique({
    where: {
      follower_user_id_following_user_id: data,
    },
  });

  if (alreadyFollow) {
    throw new wwsError(httpStatusCode.CONFLICT, 'already following that user');
  }

  // follow record 생성과 user들의 following_count increment, follower count increment가 문제 없이 실행된다면
  // 생성된 follow record를 반환한다.
  try {
    const [follow] = await prismaClient.$transaction([
      prismaClient.follow.create({
        data,
      }),
      // follower user의 following count를 감소시킨다.
      prismaClient.user.update({
        where: {
          id: data.follower_user_id,
        },
        data: {
          followings_count: { increment: 1 },
        },
      }),

      // following user의 follower count를 감소시킨다.
      prismaClient.user.update({
        where: { id: data.following_user_id },
        data: {
          followers_count: { increment: 1 },
        },
      }),
    ]);

    return follow;
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === PrismaError.UniqueConstraintViolation) {
        throw new wwsError(httpStatusCode.CONFLICT, 'already following');
      }
    }
  }
}

export async function deleteFollow(data: DeleteFollowInput) {
  await prismaClient.$transaction([
    prismaClient.follow.delete({
      where: {
        follower_user_id_following_user_id: data,
      },
    }),
    // follower user의 following count를 감소시킨다.
    prismaClient.user.update({
      where: {
        id: data.follower_user_id,
      },
      data: {
        followings_count: { decrement: 1 },
      },
    }),

    // following user의 follower count를 감소시킨다.
    prismaClient.user.update({
      where: { id: data.following_user_id },
      data: {
        followers_count: { decrement: 1 },
      },
    }),
  ]);

  return;
}

// user의 follower 목록을 가져온다.
export async function getFollowers(data: GetFollowersInput) {
  const followers = await prismaClient.follow.findMany({
    where: {
      following_user_id: data.userId,
    },
    include: { follower: true },
    skip: (data.page - 1) * data.per_page,
    take: data.per_page,
  });

  return followers.map((follow) => follow.follower);
}
