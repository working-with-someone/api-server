import prismaClient from '../../database/clients/prisma';
import { wwsError } from '../../utils/wwsError';
import httpStatusCode from 'http-status-codes';
import { deleteImage, uploadImage } from '../../lib/s3';
import { Prisma } from '../../../prisma/generated/prisma/client';
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
    throw new wwsError(httpStatusCode.NOT_FOUND, '?ъ슜?먮? 李얠쓣 ???놁뒿?덈떎.');
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

  // ?꾨Т寃껊룄 ?꾨떖?섏? ?딆븯?ㅻ㈃, ?낅뜲?댄듃 ?섏? ?딆? user 洹몃?濡쒕? return?쒕떎.
  if (!data.username && !data.pfpToDefault && !data.pfp) {
    return user;
  }

  // username???꾨떖?섏뿀?ㅻ㈃, 異붽?
  if (data.username) {
    _data.username = data.username;
  }

  // pfp瑜?default???덈줈??image濡?蹂寃쏀븯?ㅺ퀬????user??pfp媛 default媛 ?꾨땲?쇰㈃ ?쒓굅?쒕떎.
  if (data.pfpToDefault || data.pfp) {
    if (!user!.pfp!.is_default) {
      await deleteImage({
        key: user!.pfp!.curr,
      });
    }
  }
  // default濡?蹂寃쏀븯?ㅺ퀬?쒕떎硫?
  if (data.pfpToDefault) {
    // ?대? default媛 ?꾨땲?쇰㈃
    if (!user!.pfp!.is_default) {
      const pfpPath = path.posix.join(to.media.default.images, 'pfp');

      _data.pfp = {
        update: {
          curr: pfpPath,
          is_default: true,
        },
      };
    }
    // ?대? default?쇰㈃ 嫄대뱾?꾩슂 ?녿떎.
  }
  // default濡?蹂寃쏀븯?ㅻ뒗 寃껋씠 ?꾨땲怨? ?ㅻⅨ image濡?蹂寃쏀븯?ㅺ퀬?쒕떎硫?
  else if (data.pfp) {
    // user??pfp媛 default?쇰㈃, pfp留?upload?댁＜硫대맂??
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

