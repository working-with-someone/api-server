import { Prisma, PrismaClient, comment } from '@prisma/client';
import { IFactory } from './factory';
import { faker } from '@faker-js/faker';
import currUser from '../data/curr-user';

const prisma = new PrismaClient();

class CommentFactory implements IFactory<Prisma.commentCreateInput, comment> {
  create(
    overrides?: Partial<Prisma.commentCreateInput> | undefined
  ): Prisma.commentCreateInput {
    const commentData: Prisma.commentCreateInput = {
      content: overrides?.content || faker.lorem.sentence(),
      user: {
        connect: overrides?.user?.connect || { id: currUser.id },
      },

      video_session: overrides?.video_session || undefined,
      live_session: overrides?.live_session || undefined,
    };
    return commentData;
  }

  async createAndSave(
    overrides?: Partial<Prisma.commentCreateInput> | undefined
  ): Promise<comment> {
    const data = this.create(overrides);

    return prisma.comment.create({
      data,
    });
  }

  createMany?(
    options?:
      | {
          overrides?: Partial<Prisma.commentCreateInput> | undefined;
          count?: number;
        }
      | undefined
  ): Prisma.commentCreateInput[] {
    const { overrides = {}, count = 1 } = options ?? {};

    return Array.from({ length: count }, () => this.create(overrides));
  }

  async createManyAndSave?(
    options?:
      | {
          overrides?: Partial<Prisma.commentCreateInput> | undefined;
          count?: number;
        }
      | undefined
  ): Promise<comment[]> {
    const { overrides = {}, count = 1 } = options ?? {};
    const commentDataArray = Array.from({ length: count }, () =>
      this.create(overrides)
    );
    const savedComments: comment[] = [];

    for (const commentData of commentDataArray) {
      const saved = await prisma.comment.create({
        data: commentData,
      });
      savedComments.push(saved);
    }

    return savedComments;
  }

  async delete(where: Prisma.commentWhereInput): Promise<void> {
    await prisma.comment.deleteMany({ where });
  }

  async deleteMany(where: Prisma.commentWhereInput): Promise<void> {
    await prisma.comment.deleteMany({ where });
  }

  async cleanup(): Promise<void> {
    await prisma.comment.deleteMany({});
  }
}

const commentFactory = new CommentFactory();

export default commentFactory;
