import prismaClient from '../../../database/clients/prisma';
import type {
  createSessionInput,
  GetLiveSessionsInput,
} from './live-session.service.d';
import type { AttachedLiveSession } from '../../../middleware/session/live/live-session';
import { v4 } from 'uuid';
import { uploadImage } from '../../../lib/s3';
import path from 'node:path';
import { to } from '../../../config/path.config';

import { checkFollowing } from '../../follow.service';
import { Prisma, live_session_status, access_level } from '@prisma/client';
import randomString from 'randomstring';
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
  if (liveSession.access_level === access_level.FOLLOWER_ONLY) {
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
  else if (liveSession.access_level === access_level.PRIVATE) {
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
  return data.liveSession;
}

export async function getLiveSessions(data: GetLiveSessionsInput) {
  const statusArray = data.status
    ? Array.isArray(data.status)
      ? data.status
      : [data.status]
    : undefined;

  const whereCondition = {
    category_label: data.category,
    title: {
      search: data.search || undefined,
    },
    description: {
      search: data.search || undefined,
    },
    status: {
      in: statusArray,
    },
    OR: [
      // curr user의 live session은 모두
      {
        organizer_id: data.userId,
      },
      // public live session이라면 모두
      {
        access_level: access_level.PUBLIC,
      },
      // allow된 private live session이라면 모두
      {
        access_level: access_level.PRIVATE,
        allow: {
          some: {
            user_id: data.userId,
          },
        },
      },
      // following한 user의 followers only live session이라면 모두
      {
        access_level: access_level.FOLLOWER_ONLY,
        organizer: {
          followers: {
            some: {
              follower_user_id: data.userId,
            },
          },
        },
      },
    ],
  };

  const totalItems = await prismaClient.live_session.count({
    where: whereCondition,
  });

  const liveSessions = await prismaClient.live_session.findMany({
    where: whereCondition,
    skip: (data.page - 1) * data.per_page,
    take: data.per_page,
    omit: {
      stream_key: true,
    },
    include: {
      break_time: true,
      category: true,
      live_session_transition_log: true,
      organizer: {
        include: {
          pfp: true,
        },
      },
    },
  });

  const totalPages = Math.ceil(totalItems / data.per_page);
  const hasMore = data.page < totalPages;
  const previousPage = data.page > 1 ? data.page - 1 : null;
  const nextPage = hasMore ? data.page + 1 : null;

  return {
    liveSessions,
    pagination: {
      currentPage: data.page,
      totalPages,
      totalItems,
      per_page: data.per_page,
      hasMore,
      previousPage,
      nextPage,
    },
  };
}

export async function createLiveSession(data: createSessionInput) {
  const uuid = v4();
  const streamKey = randomString.generate(32);

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
      category: {
        connectOrCreate: {
          where: {
            label: data.category,
          },
          create: {
            label: data.category,
          },
        },
      },
      organizer: {
        connect: {
          id: data.userId,
        },
      },
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

export async function updateLiveSessionThumbnail(data: {
  liveSession: AttachedLiveSession;
  thumbnail: Express.Multer.File;
}) {
  const liveSession = data.liveSession;

  let thumbnail_uri = path.posix.join(to.media.default.images, 'thumbnail');

  if (data.thumbnail) {
    const key = await uploadImage('thumbnail', data.thumbnail);

    thumbnail_uri = path.posix.join(to.media.images, key);
  }

  const updatedLiveSession = await prismaClient.live_session.update({
    where: {
      id: liveSession.id,
    },
    data: {
      thumbnail_uri,
    },
  });

  return updatedLiveSession.thumbnail_uri;
}
