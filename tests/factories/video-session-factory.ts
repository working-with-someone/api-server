import { faker } from '@faker-js/faker';
import { Prisma, PrismaClient } from '@prisma/client';
import { IFactory } from './factory';
import { VideoSessionWithAll } from '../../src/@types/video-session';

const prisma = new PrismaClient();

type OverRides = Prisma.video_sessionCreateInput & {
  organizer: { connect: { id: number } };
};

class VideoSessionFactory implements IFactory<OverRides, VideoSessionWithAll> {
  create(overrides?: Partial<OverRides>): OverRides {
    const id = overrides?.id || faker.string.uuid();
    const title = overrides?.title || faker.lorem.words(3);
    const description = overrides?.description || faker.lorem.sentences(2);
    const thumbnail_uri = overrides?.thumbnail_uri || faker.image.url();
    const access_level = overrides?.access_level || 'PUBLIC';
    const duration = `${overrides?.duration || faker.number.int({ min: 60, max: 7200 })}`;

    const sessionData: OverRides = {
      id,
      title,
      description,
      thumbnail_uri,
      category: {
        connect: overrides?.category?.connect || undefined,
        connectOrCreate: overrides?.category?.connect
          ? undefined
          : {
              where: {
                label: 'test',
              },
              create: {
                label: 'test',
              },
            },
      },
      access_level,
      duration,
      created_at: overrides?.created_at || new Date(),
      updated_at: overrides?.updated_at || new Date(),
      organizer: {
        connect: overrides?.organizer?.connect || {
          id: 1,
        },
      },
    };

    return sessionData;
  }

  createAndSave(overrides?: Partial<OverRides>): Promise<VideoSessionWithAll> {
    const data = this.create(overrides);
    return prisma.video_session.create({
      data,
      include: {
        organizer: true,
        allow: true,
        break_time: true,
        category: true,
      },
    });
  }

  createMany(options?: {
    overrides?: Partial<OverRides>;
    count?: number;
  }): OverRides[] {
    const { overrides = {}, count = 1 } = options ?? {};
    return Array.from({ length: count }, () => this.create(overrides));
  }

  async createManyAndSave(options?: {
    overrides?: Partial<OverRides>;
    count?: number;
  }): Promise<VideoSessionWithAll[]> {
    const { overrides = {}, count = 1 } = options ?? {};
    const sessionsData = this.createMany({ overrides, count });

    const savedSessions: VideoSessionWithAll[] = [];

    for (const data of sessionsData) {
      const saved = await prisma.video_session.create({
        data,
        include: {
          organizer: true,
          allow: true,
          break_time: true,
          category: true,
        },
      });

      savedSessions.push(saved);
    }

    return savedSessions;
  }

  async cleanup(): Promise<void> {
    await prisma.video_session.deleteMany({});
  }
}

export const videoSessionFactory = new VideoSessionFactory();
