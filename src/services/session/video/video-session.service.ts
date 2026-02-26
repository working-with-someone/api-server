import prismaClient from '../../../database/clients/prisma';
import { checkFollowing } from '../../follow.service';
import { access_level } from '@prisma/client';
import { v4 } from 'uuid';
import { uploadImage } from '../../../lib/s3';
import path from 'node:path';
import { to } from '../../../config/path.config';
import { sanitize } from '../../../utils/sanitize';

export async function isAllowedToVideoSession(data: {
  videoSession: any;
  userId: number;
}) {
  const videoSession = data.videoSession;

  const organizer_id = videoSession.organizer_id;
  const participant_id = data.userId;

  if (organizer_id === participant_id) {
    return true;
  }

  if (videoSession.access_level === access_level.FOLLOWER_ONLY) {
    const isFollowing = await checkFollowing({
      follower_user_id: participant_id,
      following_user_id: organizer_id,
    });

    if (!isFollowing) {
      return false;
    }
  } else if (videoSession.access_level === access_level.PRIVATE) {
    const isAllowed = await prismaClient.video_session_allow.findFirst({
      where: {
        video_session_id: videoSession.id,
        user_id: participant_id,
      },
    });

    if (!isAllowed) {
      return false;
    }
  }

  return true;
}

export async function createVideoSession(data: any) {
  const uuid = v4();

  let thumbnail_uri = path.posix.join(to.media.default.images, 'thumbnail');

  if (data.thumbnail) {
    const key = await uploadImage('thumbnail', data.thumbnail);

    thumbnail_uri = path.posix.join(to.media.images, key);
  }

  const videoSession = await prismaClient.video_session.create({
    data: {
      id: uuid,
      title: data.title,
      description: data.description,
      thumbnail_uri,
      duration: String(data.duration),
      access_level: data.access_level,
      category: {
        connectOrCreate: {
          where: { label: data.category },
          create: { label: data.category },
        },
      },
      organizer: {
        connect: { id: data.userId },
      },
    },
    include: {
      break_time: true,
      category: true,
      organizer: {
        include: {
          pfp: true,
        },
      },
      allow: true,
    },
  });

  return sanitize(videoSession, {});
}

export async function getVideoSession(data: {
  videoSession: any;
  userId: number;
}) {
  return data.videoSession;
}

export async function getVideoSessions(data: {
  per_page: number;
  page: number;
  userId: number;
  category?: string;
  search?: string;
}) {
  const whereCondition = {
    category_label: data.category,
    title: {
      search: data.search || undefined,
    },
    description: {
      search: data.search || undefined,
    },
    OR: [
      { organizer_id: data.userId },
      { access_level: access_level.PUBLIC },
      {
        access_level: access_level.PRIVATE,
        allow: {
          some: {
            user_id: data.userId,
          },
        },
      },
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

  const totalItems = await prismaClient.video_session.count({
    where: whereCondition,
  });

  const videoSessions = await prismaClient.video_session.findMany({
    where: whereCondition,
    skip: (data.page - 1) * data.per_page,
    take: data.per_page,
    include: {
      break_time: true,
      category: true,
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
    videoSessions,
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
