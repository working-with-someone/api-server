import prismaClient from '../../database/clients/prisma';
import type { session } from '../../@types/session';
import { v4 } from 'uuid';
import { uploadImage } from '../../lib/s3';
import path from 'node:path';
import { to } from '../../config/path.config';

export async function createLiveSession(data: session.createSessionInput) {
  const uuid = v4();

  let thumbnail_url = path.posix.join(to.media.default.images, 'thumbnail');

  if (data.thumbnail) {
    const key = await uploadImage('thumbnail', data.thumbnail);

    thumbnail_url = path.posix.join(to.media.images, key);
  }

  const session = await prismaClient.session.create({
    data: {
      id: uuid,
      title: data.title,
      description: data.description,
      thumbnail_url,
      is_live: true,
      access_level: data.access_level,
      category: data.category,
      organizer_id: data.userId,
    },
  });

  return session;
}
