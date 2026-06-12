import { Prisma, PrismaClient, session_like } from '@prisma/client';
import { IFactory } from './factory';
import currUser from '../data/curr-user';

const prisma = new PrismaClient();

class LikeFactory
  implements IFactory<Prisma.session_likeCreateInput, session_like>
{
  create(
    overrides?: Partial<Prisma.session_likeCreateInput>
  ): Prisma.session_likeCreateInput {
    const likeData: Prisma.session_likeCreateInput = {
      user: overrides?.user || { connect: { id: currUser.id } },
      video_session: overrides?.video_session || undefined,
      live_session: overrides?.live_session || undefined,
    };

    return likeData;
  }

  async createAndSave(
    overrides?: Partial<Prisma.session_likeCreateInput>
  ): Promise<session_like> {
    const data = this.create(overrides);

    return prisma.session_like.create({
      data,
    });
  }

  createMany(options?: {
    overrides?: Partial<Prisma.session_likeCreateInput>;
    count?: number;
  }): Prisma.session_likeCreateInput[] {
    const { overrides = {}, count = 1 } = options ?? {};

    return Array.from({ length: count }, () => this.create(overrides));
  }

  async createManyAndSave(options?: {
    overrides?: Partial<Prisma.session_likeCreateInput>;
    count?: number;
  }): Promise<session_like[]> {
    const { overrides = {}, count = 1 } = options ?? {};
    const likesData = this.createMany({ overrides, count });
    const savedLikes: session_like[] = [];

    for (const data of likesData) {
      const saved = await prisma.session_like.create({ data });
      savedLikes.push(saved);
    }
    return savedLikes;
  }

  async delete(where: Prisma.session_likeWhereUniqueInput): Promise<void> {
    await prisma.session_like.delete({ where });
  }

  async cleanup(): Promise<void> {
    await prisma.session_like.deleteMany({});
  }
}

const likeFactory = new LikeFactory();

export default likeFactory;
