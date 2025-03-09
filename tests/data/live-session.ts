import { Prisma } from '@prisma/client';
import prismaClient from '../../src/database/clients/prisma';
import { v4 } from 'uuid';
import fs from 'node:fs';

interface CreateTestLiveSessionCreationInput
  extends Pick<
    Prisma.live_sessionGetPayload<true>,
    'access_level' | 'organizer_id' | 'status'
  > {
  break_time?: Pick<Prisma.break_timeCreateInput, 'interval' | 'duration'>;
}

export async function createTestLiveSession(
  data: CreateTestLiveSessionCreationInput
) {
  const liveSession = await prismaClient.live_session.create({
    data: {
      id: v4(),
      title: 'test with me',
      description: "it's just test",
      thumbnail_uri: 'https://example.com/thumbnails/morning-study.jpg',
      stream_key: v4(),
      category: 'study',
      access_level: data.access_level,
      organizer_id: data.organizer_id,
      status: data.status,

      break_time: {
        create: data.break_time,
      },
    },
  });

  return liveSession;
}

export const sampleLiveSessionFields = {
  title: 'test with me',
  description: "it's just test",
  category: 'study',
  getThumbnailReadable: () =>
    fs.createReadStream('./tests/data/images/image.png'),
};

export const sampleBreakTimeFields: Pick<
  Prisma.break_timeCreateInput,
  'interval' | 'duration'
> = {
  interval: 50,
  duration: 10,
};
