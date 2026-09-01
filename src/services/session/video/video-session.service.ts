import prismaClient from '../../../database/clients/prisma';
import { checkFollowing } from '../../follow.service';
import {
  access_level,
  Prisma,
} from '../../../../prisma/generated/prisma/client';
import { v4 } from 'uuid';
import { uploadImage } from '../../../lib/s3';
import path from 'node:path';
import {
  CreateVideoSessionInput,
  UpdateVideoSessionInput,
} from './video-session';
import { Input as MediaInfo, ALL_FORMATS, UrlSource } from 'mediabunny';
import { mediaServer, to } from '../../../config/path.config';
import { wwsError } from '../../../utils/wwsError';
import httpStatusCodes from 'http-status-codes';
import { PublicVideoSession } from '../../../types/contracts/video-session';
import { PaginatedResult } from '../../../types/pagination';
import { buildPaginationMeta } from '../../../utils/pagination';
import es from '../../../lib/search';
import { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';

export async function isAllowedToVideoSession(data: {
  videoSession: any;
  userId: number;
}): Promise<boolean> {
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

export async function createVideoSession(
  data: CreateVideoSessionInput
): Promise<PublicVideoSession> {
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
  const createdVideoSession = await prismaClient.video_session.create({
    data: {
      id: v4(),
      video_id: data.video_id,
      title: data.title || Date.now().toString(),
      description: data.description,
      thumbnail_uri,
      duration: duration.toString(),
      access_level: data.access_level,
      comment_enabled: data.comment_enabled,
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

  await es.video_session.create(createdVideoSession);

  return createdVideoSession;
}

export async function updateVideoSession(
  data: UpdateVideoSessionInput
): Promise<PublicVideoSession> {
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
  if (typeof data.comment_enabled !== 'undefined')
    updateData.comment_enabled = data.comment_enabled;

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

  const updatedVideoSession = await prismaClient.video_session.update({
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

  await es.video_session.update(updatedVideoSession);

  return updatedVideoSession;
}

export async function getVideoSession(data: {
  videoSession: any;
  userId: number;
}): Promise<PublicVideoSession> {
  return data.videoSession;
}

export async function getVideoSessions(data: {
  per_page: number;

  page: number;

  userId: number;

  category?: string;

  search?: string;

  sort?: string;
}): Promise<PaginatedResult<PublicVideoSession[], 'videoSessions'>> {
  const followings = await prismaClient.follow.findMany({
    where: { follower_user_id: data.userId },

    select: { following_user_id: true },
  });

  const followingUserIds = followings.map(
    (following) => following.following_user_id
  );

  const mustQueries: QueryDslQueryContainer[] = [
    data.search
      ? {
          multi_match: {
            query: data.search,
            // 가중치 부여
            fields: ['title^5.0', 'description^2.0', 'organizer.username^1.0'],
          },
        }
      : { match_all: {} },
  ];

  const filterQueries: QueryDslQueryContainer[] = [
    {
      bool: {
        should: [
          { term: { 'organizer.id': data.userId } },

          { term: { access_level: access_level.PUBLIC } },

          {
            bool: {
              filter: [
                { term: { access_level: access_level.PRIVATE } },

                { term: { allowed_list: data.userId } },
              ],
            },
          },

          ...(followingUserIds.length > 0
            ? [
                {
                  bool: {
                    filter: [
                      {
                        term: {
                          access_level: access_level.FOLLOWER_ONLY,
                        },
                      },

                      { terms: { 'organizer.id': followingUserIds } },
                    ],
                  },
                },
              ]
            : []),
        ],
        minimum_should_match: 1,
      },
    },
  ];

  if (data.category) {
    filterQueries.push({ term: { category: data.category } });
  }

  const sortOption =
    data.sort === 'recent'
      ? [{ created_at: { order: 'desc' as const } }]
      : undefined;

  const documents = await es.video_session.search({
    from: (data.page - 1) * data.per_page,

    size: data.per_page + 1,

    sort: sortOption,

    query: {
      bool: {
        must: mustQueries,

        filter: filterQueries,
      },
    },
  });

  const sessionIds = documents.map((doc) => doc.id);

  const videoSessionsFromDb = await prismaClient.video_session.findMany({
    where: {
      id: { in: sessionIds },
    },

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

  const sessionMap = new Map(videoSessionsFromDb.map((s) => [s.id, s]));

  const videoSessions = sessionIds
    .map((id) => sessionMap.get(id))
    .filter(Boolean) as PublicVideoSession[];

  const pagination = buildPaginationMeta(
    videoSessions,
    data.page,
    data.per_page
  );

  if (pagination.hasMore) {
    videoSessions.pop();
  }

  return {
    videoSessions,
    pagination,
  };
}
