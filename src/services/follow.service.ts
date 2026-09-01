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
} from './follow.service.d';

import { Prisma } from '../../prisma/generated/prisma/client';
import { PublicFollower, PublicFollowing } from '../types/contracts/follow';
import { PaginatedResult } from '../types/pagination';
import { buildPaginationMeta } from '../utils/pagination';

export async function getFollowing(
  data: GetFollowingInput
): Promise<PublicFollowing | null> {
  const following = await prismaClient.follow.findUnique({
    where: {
      follower_user_id_following_user_id: data,
    },
    include: {
      following: {
        include: {
          pfp: true,
        },
      },
    },
  });

  return following;
}

export async function checkFollowing(
  data: CheckFollowingInput
): Promise<boolean> {
  const follow = await getFollowing(data);

  return follow ? true : false;
}

export async function getFollowings(
  data: GetFollowingsInput
): Promise<PaginatedResult<PublicFollowing[], 'follows'>> {
  const follows = await prismaClient.follow.findMany({
    where: {
      follower_user_id: data.userId,
    },
    include: {
      following: {
        include: {
          pfp: true,
        },
      },
    },
    skip: (data.page - 1) * data.per_page,
    take: data.per_page + 1,
  });

  const pagination = buildPaginationMeta(follows, data.page, data.per_page);

  if (pagination.hasMore) {
    follows.pop();
  }

  return {
    follows,
    pagination,
  };
}

export async function createFollowing(
  data: CreateFollowingInput
): Promise<PublicFollowing> {
  try {
    const [follow] = await prismaClient.$transaction([
      prismaClient.follow.create({
        data,
        include: {
          following: {
            include: {
              pfp: true,
            },
          },
        },
      }),
      prismaClient.user.update({
        where: {
          id: data.follower_user_id,
        },
        data: {
          followings_count: { increment: 1 },
        },
      }),

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

    throw err;
  }
}

export async function deleteFollow(data: DeleteFollowInput) {
  await prismaClient.$transaction([
    prismaClient.follow.delete({
      where: {
        follower_user_id_following_user_id: data,
      },
    }),
    prismaClient.user.update({
      where: {
        id: data.follower_user_id,
      },
      data: {
        followings_count: { decrement: 1 },
      },
    }),

    prismaClient.user.update({
      where: { id: data.following_user_id },
      data: {
        followers_count: { decrement: 1 },
      },
    }),
  ]);

  return;
}

export async function getFollowers(
  data: GetFollowersInput
): Promise<PublicFollower[]> {
  const followers = await prismaClient.follow.findMany({
    where: {
      following_user_id: data.userId,
    },
    include: { follower: { include: { pfp: true } } },
    skip: (data.page - 1) * data.per_page,
    take: data.per_page + 1,
  });

  const pagination = buildPaginationMeta(followers, data.page, data.per_page);

  if (pagination.hasMore) {
    followers.pop();
  }

  return followers;
}
