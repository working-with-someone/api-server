import { Prisma } from '@prisma/client';
import prismaClient from '../../src/database/clients/prisma';
import { v4 } from 'uuid';
import fs from 'node:fs';

export async function createTestLiveSession(
  data: Pick<
    Prisma.live_sessionGetPayload<true>,
    'access_level' | 'organizer_id' | 'status'
  >
) {
  const liveSession = await prismaClient.live_session.create({
    data: {
      id: v4(),
      title: 'test with me',
      description: "it's just test",
      thumbnail_uri: 'https://example.com/thumbnails/morning-study.jpg',
      stream_key: v4(),
      category: 'study',
      ...data,
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
