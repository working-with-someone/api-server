import prismaClient from '../database/clients/prisma';
import { wwsError } from '../utils/wwsError';
import httpStatusCode from 'http-status-codes';
import pick from '../utils/pick';
import type { user } from '../@types/user';
import { deleteImage, uploadImage } from '../lib/s3';
import { Prisma } from '@prisma/client';

export async function getUser(userId: number, isSelf: boolean) {
  const user = await prismaClient.user.findUnique({ where: { id: userId } });

  if (!user) {
    throw new wwsError(httpStatusCode.NOT_FOUND, '사용자를 찾을 수 없습니다.');
  }

  if (isSelf) {
    return user;
  }

  return getPublicUserInfo(user);
}

export async function updateSelf(userId: number, data: user.updateUserInput) {
  const _data: Prisma.userUpdateInput = {
    username: data.username,
  };

  const user = await getUser(userId, true);

  // file이 전달되었다면, user pfp를 update한다.
  if (data.pfp) {
    // user의 default pfp가 아니라면, upload되어있는 pfp를 제거
    if (user.pfp != './pfp.png') {
      await deleteImage(user.pfp);
    }

    // upload pfp
    const key = await uploadImage('pfp', data.pfp);

    _data.pfp = key;
  }

  const updatedUser = await prismaClient.user.update({
    where: {
      id: userId,
    },
    data: _data,
  });

  return updatedUser;
}

export const getPublicUserInfo = (
  user: Record<string, any>
): user.PublicUserInfo => pick(user, ['id', 'username', 'pfp', 'email']);
