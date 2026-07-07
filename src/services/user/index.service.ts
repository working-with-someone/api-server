import prismaClient from '../../database/clients/prisma';
import { wwsError } from '../../utils/wwsError';
import httpStatusCode from 'http-status-codes';
import { deleteImage, uploadImage } from '../../lib/s3';
import { Prisma } from '@prisma/client';
import { to } from '../../config/path.config';
import path from 'path';
import type { UpdateUserInput } from './index.service.d';
import { PublicUser } from '../../types/contracts/user';

export async function getUser(
  userId: number,
  isSelf: boolean
): Promise<PublicUser> {
  const user = await prismaClient.user.findFirst({
    where: { id: userId },
    include: {
      pfp: true,
      preferred_categories: {
        orderBy: { priority: 'asc' },
      },
    },
    omit: {
      encrypted_password: true,
    },
  });

  if (!user) {
    throw new wwsError(httpStatusCode.NOT_FOUND, '사용자를 찾을 수 없습니다.');
  }

  return user;
}

export async function updateUser(
  userId: number,
  data: UpdateUserInput
): Promise<PublicUser | null> {
  const _data: Prisma.userUpdateInput = {};

  const user = await prismaClient.user.findFirst({
    where: { id: userId },
    include: { pfp: true },
  });

  // 아무것도 전달되지 않았다면, 업데이트 되지 않은 user 그대로를 return한다.
  if (!data.username && !data.pfpToDefault && !data.pfp) {
    return user;
  }

  // username이 전달되었다면, 추가
  if (data.username) {
    _data.username = data.username;
  }

  // pfp를 default나 새로운 image로 변경하려고할 때,user의 pfp가 default가 아니라면 제거한다.
  if (data.pfpToDefault || data.pfp) {
    if (!user!.pfp!.is_default) {
      await deleteImage({
        key: user!.pfp!.curr,
      });
    }
  }
  // default로 변경하려고한다면
  if (data.pfpToDefault) {
    // 이미 default가 아니라면
    if (!user!.pfp!.is_default) {
      const pfpPath = path.posix.join(to.media.default.images, 'pfp');

      _data.pfp = {
        update: {
          curr: pfpPath,
          is_default: true,
        },
      };
    }
    // 이미 default라면 건들필요 없다.
  }
  // default로 변경하려는 것이 아니고, 다른 image로 변경하려고한다면
  else if (data.pfp) {
    // user의 pfp가 default라면, pfp만 upload해주면된다.
    const key = await uploadImage('pfp', data.pfp);

    const pfpPath = path.posix.join(to.media.images, key);

    _data.pfp = { update: { curr: pfpPath, is_default: false } };
  }

  const updatedUser = await prismaClient.user.update({
    where: {
      id: userId,
    },
    data: _data,
    include: {
      pfp: true,
    },
    omit: {
      encrypted_password: true,
    },
  });

  return updatedUser;
}
