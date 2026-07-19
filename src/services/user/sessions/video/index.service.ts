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
import { buildPagenationMeta } from '../../../../utils/pagination';

export async function getUserVideoSessions(
  input: GetUserVideoSessionsInput
): Promise<PaginatedResult<PublicVideoSession[], 'videoSessions'>> {
  const videoSessions = await prismaClient.video_session.findMany({
    where: {
      organizer_id: input.userId,
      OR: [
        // if organizer is current user
        {
          organizer_id: input.currUserId,
        },
        // if video session is public
        {
          access_level: access_level.PUBLIC,
        },
        // if video session is private and current user is allowed
        {
          access_level: access_level.PRIVATE,
          allow: {
            some: {
              user_id: input.currUserId,
            },
          },
        },
        // if video session is follower only and current user is following the organizer
        {
          access_level: access_level.FOLLOWER_ONLY,
          organizer: {
            followers: {
              some: {
                follower_user_id: input.currUserId,
              },
            },
          },
        },
      ],
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
    skip: (input.page - 1) * input.per_page,
    take: input.per_page + 1,
  });

  const pagination = buildPagenationMeta(videoSessions, input.page, input.per_page);

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

