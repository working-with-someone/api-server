import { access_level } from '../../../../../prisma/generated/prisma/client';
import prismaClient from '../../../../database/clients/prisma';
import { isAllowedToVideoSession } from '../../../session/video/video-session.service';
import type {
  GetUserVideoSessionsInput,
  GetUserVideoSessionInput,
} from './index.service.d';
import { wwsError } from '../../../../utils/wwsError';
import httpStatusCodes from 'http-status-codes';
import { PublicVideoSession } from '../../../../types/contracts/video-session';
import { PaginatedResult } from '../../../../types/pagination';
import { buildPaginationMeta } from '../../../../utils/pagination';
import es from '../../../../lib/search';
import { QueryDslQueryContainer } from '@elastic/elasticsearch/lib/api/types';

export async function getUserVideoSessions(
  input: GetUserVideoSessionsInput
): Promise<PaginatedResult<PublicVideoSession[], 'videoSessions'>> {
  const followings = await prismaClient.follow.findMany({
    where: { follower_user_id: input.currUserId },
    select: { following_user_id: true },
  });

  const followingUserIds = followings.map(
    (following) => following.following_user_id
  );

  const filterQueries: QueryDslQueryContainer[] = [
    { term: { 'organizer.id': input.userId } },
    {
      bool: {
        should: [
          { term: { 'organizer.id': input.currUserId } },

          { term: { access_level: access_level.PUBLIC } },

          {
            bool: {
              filter: [
                { term: { access_level: access_level.PRIVATE } },

                { term: { allowed_list: input.currUserId } },
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

  const documents = await es.video_session.search({
    from: (input.page - 1) * input.per_page,
    size: input.per_page + 1,
    query: {
      bool: {
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
    input.page,
    input.per_page
  );

  if (pagination.hasMore) {
    videoSessions.pop();
  }

  return {
    videoSessions,
    pagination,
  };
}

export async function getUserVideoSession(
  input: GetUserVideoSessionInput
): Promise<PublicVideoSession> {
  const videoSession = await prismaClient.video_session.findFirst({
    where: {
      id: input.videoSessionId,
      organizer_id: input.userId,
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

  if (!videoSession) {
    throw new wwsError(httpStatusCodes.NOT_FOUND, 'video session not found');
  }

  if (
    videoSession.access_level === access_level.PRIVATE ||
    videoSession.access_level === access_level.FOLLOWER_ONLY
  ) {
    const isAllowed = await isAllowedToVideoSession({
      videoSession,
      userId: input.currUserId,
    });

    if (!isAllowed) {
      throw new wwsError(
        httpStatusCodes.FORBIDDEN,
        'You are not allowed to access this video session'
      );
    }
  }

  return videoSession;
}
