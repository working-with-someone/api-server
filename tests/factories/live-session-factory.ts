import { faker } from '@faker-js/faker';
import { Prisma, PrismaClient } from '@prisma/client';
import { IFactory } from './factory';
import { PrivateLiveASession } from '../../src/types/contracts/live-session';

const prisma = new PrismaClient();

type OverRides = Prisma.live_sessionCreateInput & {
  organizer: { connect: { id: number } };
};

class LiveSessionFactory implements IFactory<OverRides, PrivateLiveASession> {
  create(overrides?: Partial<OverRides>): OverRides {
    const id = overrides?.id || faker.string.uuid();
    const title = overrides?.title || faker.lorem.words(3);
    const description = overrides?.description || faker.lorem.sentences(2);
    const thumbnail_uri = overrides?.thumbnail_uri || faker.image.url();
    const stream_key = overrides?.stream_key || faker.string.uuid();
    const access_level = overrides?.access_level || 'PUBLIC';
    const status = overrides?.status || 'READY';

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
      stream_key,
      access_level,
      status,
      created_at: overrides?.created_at || new Date(),
      updated_at: overrides?.updated_at || new Date(),
      started_at: overrides?.started_at || null,
      organizer: {
        connect: overrides?.organizer?.connect || {
          id: 1,
        },
      },

      allow: overrides?.allow || undefined,
      break_time: overrides?.break_time || undefined,
      live_session_transition_log:
        overrides?.live_session_transition_log || undefined,
    };

    return sessionData;
  }

  async createAndSave(
    overrides?: Partial<OverRides>
  ): Promise<PrivateLiveASession> {
    const data = this.create(overrides);
    return await prisma.live_session.create({
      data,
      include: {
        organizer: {
          include: {
            pfp: true,
          },
        },
        category: true,
        allow: true,
        break_time: true,
        live_session_transition_log: true,
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
  }): Promise<PrivateLiveASession[]> {
    const { overrides = {}, count = 1 } = options ?? {};
    const sessionsData = this.createMany({ overrides, count });

    const savedSessions: PrivateLiveASession[] = [];
    for (const data of sessionsData) {
      const saved = await prisma.live_session.create({
        data,
        include: {
          organizer: {
            include: {
              pfp: true,
            },
          },
          allow: true,
          break_time: true,
          live_session_transition_log: true,
          category: true,
        },
      });

      savedSessions.push(saved);
    }

    return savedSessions;
  }

  async delete(where: Prisma.live_sessionWhereInput): Promise<void> {
    await prisma.live_session.deleteMany({ where });
  }

  async deleteMany(where: Prisma.live_sessionWhereInput): Promise<void> {
    await prisma.live_session.deleteMany({ where });
  }

  async cleanup(): Promise<void> {
    await prisma.live_session.deleteMany({});
  }
}

const liveSessionFactory = new LiveSessionFactory();
export default liveSessionFactory;
