import prismaClient from '../../../database/clients/prisma';
import type {
  createSessionInput,
  GetLiveSessionsInput,
} from './live-session.service.d';
import { v4 } from 'uuid';
import { uploadImage } from '../../../lib/s3';
import path from 'node:path';
import { to } from '../../../config/path.config';

import { checkFollowing } from '../../follow.service';
import { Prisma, live_session_status, access_level } from '../../../../prisma/generated/prisma/client';
import randomString from 'randomstring';
import { sanitize } from '../../../utils/sanitize';
import {
  PublicLiveSession,
  PublicLiveSessionStatus,
  PublicLiveSessionThumbnailUri,
} from '../../../types/contracts/live-session';
import { PaginatedResult } from '../../../types/pagination';
import { buildPagenationMeta } from '../../../utils/pagination';

export async function isAllowedToLiveSession(data: {
  liveSession: PublicLiveSession;
  userId: number;
}): Promise<boolean> {
  const liveSession = data.liveSession;

  const organizer_id = liveSession.organizer_id;
  const participant_id = data.userId;

  // ?먯떊??session?대씪硫? access level??愿怨꾩뾾???묎렐 媛?ν븯??
  if (organizer_id === participant_id) {
    return true;
  }

  // access level follower only?쇰㈃, follwing check
  if (liveSession.access_level === access_level.FOLLOWER_ONLY) {
    const isFollowing = await checkFollowing({
      follower_user_id: participant_id,
      following_user_id: organizer_id,
    });

    // organizer??follower媛 ?꾨땲?쇰㈃ false
    if (!isFollowing) {
      return false;
    }
  }
  // access level??private?쇰㈃ allowList check
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
  liveSession: PublicLiveSession;
  userId: number;
}): Promise<PublicLiveSession> {
  return data.liveSession;
}

export async function getLiveSessions(
  data: GetLiveSessionsInput
): Promise<PaginatedResult<PublicLiveSession[], 'liveSessions'>> {
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
      // curr user??live session? 紐⑤몢
      {
        organizer_id: data.userId,
      },
      // public live session?대씪硫?紐⑤몢
      {
        access_level: access_level.PUBLIC,
      },
      // allow??private live session?대씪硫?紐⑤몢
      {
        access_level: access_level.PRIVATE,
        allow: {
          some: {
            user_id: data.userId,
          },
        },
      },
      // following??user??followers only live session?대씪硫?紐⑤몢
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
    take: data.per_page + 1,
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

  const pagination = buildPagenationMeta(liveSessions, data.page, data.per_page);

  if (pagination.hasMore) {
    liveSessions.pop();
  }

  return {
    liveSessions,
    pagination,
  };
}

export async function createLiveSession(
  data: createSessionInput
): Promise<PublicLiveSession> {
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
    omit: {
      stream_key: true,
    },
  });

  return liveSession;
}

export async function updateLiveSessionStatus(data: {
  liveSession: PublicLiveSession;
  status: live_session_status;
}): Promise<PublicLiveSessionStatus> {
  const liveSession = data.liveSession;

  const updateInput: Prisma.live_sessionUpdateInput = {
    status: data.status,
  };

  // live session??ready ?곹깭?먯꽌 open???? started_at??湲곕줉?쒕떎.
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
  liveSession: PublicLiveSession;
  thumbnail: Express.Multer.File;
}): Promise<PublicLiveSessionThumbnailUri> {
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

