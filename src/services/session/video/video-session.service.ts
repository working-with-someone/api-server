import prismaClient from '../../../database/clients/prisma';
import { checkFollowing } from '../../follow.service';
import { access_level, Prisma, PrismaClient } from '@prisma/client';
import { v4 } from 'uuid';
import { uploadImage } from '../../../lib/s3';
import path from 'node:path';
import { sanitize } from '../../../utils/sanitize';
import {
  CreateVideoSessionInput,
  UpdateVideoSessionInput,
} from './video-session';
import { Input as MediaInfo, ALL_FORMATS, UrlSource } from 'mediabunny';
import { mediaServer, to } from '../../../config/path.config';
import { wwsError } from '../../../utils/wwsError';
import httpStatusCodes from 'http-status-codes';

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

export async function createVideoSession(data: CreateVideoSessionInput) {
  let thumbnail_uri = path.posix.join(to.media.default.images, 'thumbnail');

  if (data.thumbnail) {
    const key = await uploadImage('thumbnail', data.thumbnail);

    thumbnail_uri = path.posix.join(to.media.images, key);
  }

  const videoURL = path.posix.join(
    mediaServer.to.staticServer.video.href,
    data.video_id
  );

  const mediaInfo = new MediaInfo({
    source: new UrlSource(videoURL),
    formats: ALL_FORMATS,
  });

  const duration = await mediaInfo.computeDuration();
  const videoSession = await prismaClient.video_session.create({
    data: {
      id: v4(),
      video_id: data.video_id,
      title: data.title || Date.now().toString(),
      description: data.description,
      thumbnail_uri,
      duration: duration.toString(),
      access_level: data.access_level,
      category: data.category_label
        ? {
            connect: {
              label: data.category_label,
            },
          }
        : undefined,
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

export async function updateVideoSession(data: UpdateVideoSessionInput) {
  const updateData: Prisma.video_sessionUpdateInput = {};

  let thumbnail_uri = path.posix.join(to.media.default.images, 'thumbnail');

  if (data.thumbnail) {
    const key = await uploadImage('thumbnail', data.thumbnail);

    thumbnail_uri = path.posix.join(to.media.images, key);

    updateData.thumbnail_uri = thumbnail_uri;
  }

  if (typeof data.title !== 'undefined') updateData.title = data.title;
  if (typeof data.description !== 'undefined')
    updateData.description = data.description;
  if (typeof data.access_level !== 'undefined')
    updateData.access_level = data.access_level;

  if (typeof data.category_label !== 'undefined') {
    const categoryExists = await prismaClient.category.findUnique({
      where: { label: data.category_label },
    });

    if (!categoryExists) {
      throw new wwsError(
        httpStatusCodes.BAD_REQUEST,
        'Category does not exist'
      );
    }

    updateData.category = {
      connect: { label: data.category_label },
    };
  }

  const updated = await prismaClient.video_session.update({
    where: { id: data.videoSession.id },
    data: updateData,
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

  return sanitize(updated, {});
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
