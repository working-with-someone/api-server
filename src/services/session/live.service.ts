import prismaClient from '../../database/clients/prisma';
import type {
  createSessionInput,
  getSessionInput,
  isAllowedToSessionInput,
  updateLiveSessionStatus,
} from '../../@types/session';
import { v4 } from 'uuid';
import { uploadImage } from '../../lib/s3';
import path from 'node:path';
import { to } from '../../config/path.config';
import { wwsError } from '../../utils/wwsError';
import httpStatusCode from 'http-status-codes';
import { accessLevel, liveSessionStatus } from '../../enums/session';
import { checkFollowing } from '../follow.service';
import { Prisma } from '@prisma/client';

export async function isAllowedToSession(data: isAllowedToSessionInput) {
  const session = data.session;

  const organizer_id = session.organizer_id;
  const participant_id = data.userId;

  // 자신의 session이라면, access level에 관계없이 접근 가능하다.
  if (organizer_id === participant_id) {
    return true;
  }

  // access level follower only라면, follwing check
  if (session.access_level === accessLevel.followersOnly) {
    const isFollowing = await checkFollowing({
      follower_user_id: participant_id,
      following_user_id: organizer_id,
    });

    // organizer의 follower가 아니라면 false
    if (!isFollowing) {
      return false;
    }
  }
  // access level이 private라면 allowList check
  else if (session.access_level === accessLevel.private) {
    const isAllowed = await prismaClient.session_allow.findFirst({
      where: {
        session_id: session.id,
        user_id: participant_id,
      },
    });

    if (!isAllowed) {
      return false;
    }
  }

  return true;
}

export async function getLiveSession(data: getSessionInput) {
  if (!(await isAllowedToSession(data))) {
    throw new wwsError(httpStatusCode.FORBIDDEN);
  }
  //public이라면
  return data.session;
}

export async function createLiveSession(data: createSessionInput) {
  const uuid = v4();

  let thumbnail_url = path.posix.join(to.media.default.images, 'thumbnail');

  if (data.thumbnail) {
    const key = await uploadImage('thumbnail', data.thumbnail);

    thumbnail_url = path.posix.join(to.media.images, key);
  }

  const session = await prismaClient.session.create({
    data: {
      id: uuid,
      title: data.title,
      description: data.description,
      thumbnail_url,
      is_live: true,
      access_level: data.access_level,
      category: data.category,
      organizer_id: data.userId,
      session_live: {
        create: {
          status: liveSessionStatus.ready,
        },
      },
    },
  });

  return session;
}

export async function updateLiveSessionStatus(data: updateLiveSessionStatus) {
  let session = data.session;

  const updateInput: Prisma.session_liveUpdateInput = {
    status: data.status,
  };

  // live session이 ready 상태에서 open될 때, started_at을 기록한다.
  if (
    session.session_live?.status == liveSessionStatus.ready &&
    data.status == liveSessionStatus.opened
  ) {
    updateInput.started_at = new Date();
  }

  session = await prismaClient.session.update({
    where: {
      id: session.id,
    },
    data: {
      session_live: {
        update: updateInput,
      },
    },
    include: {
      session_live: true,
    },
  });

  return session.session_live?.status;
}
