import { Prisma, PrismaClient, video_session_like } from '@prisma/client';
import { IFactory } from './factory';
import currUser from '../data/curr-user';

const prisma = new PrismaClient();

type CreateInput = {
  video_session: NonNullable<
    Prisma.video_session_likeCreateInput['video_session']
  >;
  user?: Prisma.video_session_likeCreateInput['user'];
};

class VideoSessionLikeFactory
  implements IFactory<CreateInput, video_session_like>
{
  create(overrides: CreateInput): Prisma.video_session_likeCreateInput {
    return {
      user: overrides.user ?? { connect: { id: currUser.id } },
      video_session: overrides.video_session,
    };
  }

  async createAndSave(overrides: CreateInput): Promise<video_session_like> {
    const data = this.create(overrides);

    return prisma.video_session_like.create({
      data,
    });
  }

  createMany(options: {
    overrides: CreateInput;
    count?: number;
  }): Prisma.video_session_likeCreateInput[] {
    const { overrides, count = 1 } = options;

    return Array.from({ length: count }, () => this.create(overrides));
  }

  async createManyAndSave(options: {
    overrides: CreateInput;
    count?: number;
  }): Promise<video_session_like[]> {
    const { overrides, count = 1 } = options;
    const likesData = this.createMany({ overrides, count });
    const savedLikes: video_session_like[] = [];

    for (const data of likesData) {
      const saved = await prisma.video_session_like.create({ data });
      savedLikes.push(saved);
    }
    return savedLikes;
  }

  async delete(
    where: Prisma.video_session_likeWhereUniqueInput
  ): Promise<void> {
    await prisma.video_session_like.delete({ where });
  }

  async cleanup(): Promise<void> {
    await prisma.video_session_like.deleteMany({});
  }
}

const videoSessionLikeFactory = new VideoSessionLikeFactory();

export default videoSessionLikeFactory;
