import prismaClient from '../../../database/clients/prisma';
import type {
  AttachedLiveSession,
  createSessionInput,
} from '../../../types/session/live';
import { v4 } from 'uuid';
import { uploadImage } from '../../../lib/s3';
import path from 'node:path';
import { to } from '../../../config/path.config';
import { accessLevel } from '../../../enums/session';
import { checkFollowing } from '../../follow.service';
import { Prisma, live_session_status } from '@prisma/client';
import { generateStreamKey } from '../../../utils/generator';
import { sanitize } from '../../../utils/sanitize';

export async function isAllowedToLiveSession(data: {
  liveSession: AttachedLiveSession;
  userId: number;
}) {
  const liveSession = data.liveSession;

  const organizer_id = liveSession.organizer_id;
  const participant_id = data.userId;

  // 자신의 session이라면, access level에 관계없이 접근 가능하다.
  if (organizer_id === participant_id) {
    return true;
  }

  // access level follower only라면, follwing check
  if (liveSession.access_level === accessLevel.followersOnly) {
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
  else if (liveSession.access_level === accessLevel.private) {
    const isAllowed = await prismaClient.live_session_allow.findFirst({
      where: {
        live_session_id: liveSession.id,
        user_id: participant_id,
      },
    });

    if (!isAllowed) {
      return false;
    }
  }

  return true;
}

export async function getLiveSession(data: {
  liveSession: AttachedLiveSession;
  userId: number;
}) {
  const sanitizedLiveSession = sanitize(data.liveSession, {
    exclude: ['stream_key'],
  });

  return sanitizedLiveSession;
}

export async function createLiveSession(data: createSessionInput) {
  const uuid = v4();
  const streamKey = generateStreamKey();

  let thumbnail_uri = path.posix.join(to.media.default.images, 'thumbnail');

  if (data.thumbnail) {
    const key = await uploadImage('thumbnail', data.thumbnail);

    thumbnail_uri = path.posix.join(to.media.images, key);
  }

  const liveSession = await prismaClient.live_session.create({
    data: {
      id: uuid,
      title: data.title,
      description: data.description,
      thumbnail_uri,
      access_level: data.access_level,
      category: data.category,
      organizer_id: data.userId,
      status: live_session_status.READY,
      stream_key: streamKey,
    },
  });

  const sanitizedLiveSession = sanitize(liveSession, {
    exclude: ['stream_key'],
  });

  return sanitizedLiveSession;
}

export async function updateLiveSessionStatus(data: {
  liveSession: AttachedLiveSession;
  status: live_session_status;
}) {
  const liveSession = data.liveSession;

  const updateInput: Prisma.live_sessionUpdateInput = {
    status: data.status,
  };

  // live session이 ready 상태에서 open될 때, started_at을 기록한다.
  if (
    liveSession.status == live_session_status.READY &&
    data.status == live_session_status.OPENED
  ) {
    updateInput.started_at = new Date();
  }

  const [_, updatedLiveSession] = await prismaClient.$transaction([
    prismaClient.live_session_transition_log.create({
      data: {
        from_state: liveSession.status,
        to_state: data.status,
        live_session_id: liveSession.id,
      },
    }),

    prismaClient.live_session.update({
      where: {
        id: liveSession.id,
      },
      data: updateInput,
    }),
  ]);

  return updatedLiveSession.status;
}
