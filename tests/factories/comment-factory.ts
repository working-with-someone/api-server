import { Prisma, video_session_comment } from '../../prisma/generated/prisma/client';
import { IFactory } from './factory';
import { faker } from '@faker-js/faker';
import currUser from '../data/curr-user';
import { PublicVideoSessionComment } from '../../src/types/contracts/comment';
import prismaClient from '../../src/database/clients/prisma';

const prisma = prismaClient;

class CommentFactory
  implements
    IFactory<Prisma.video_session_commentCreateInput, video_session_comment>
{
  create(
    overrides?: Partial<Prisma.video_session_commentCreateInput> | undefined
  ): Prisma.video_session_commentCreateInput {
    const commentData: Prisma.video_session_commentCreateInput = {
      content: overrides?.content || faker.lorem.sentence(),
      user: {
        connect: overrides?.user?.connect || { id: currUser.id },
      },

      video_session: overrides?.video_session || undefined,
    };
    return commentData;
  }

  async createAndSave(
    overrides?: Partial<Prisma.video_session_commentCreateInput> | undefined
  ): Promise<PublicVideoSessionComment> {
    const data = this.create(overrides);

    return prisma.video_session_comment.create({
      data,
      include: {
        user: {
          include: {
            pfp: true,
          },
        },
        video_session: true,
      },
    });
  }

  createMany(
    options?:
      | {
          overrides?:
            | Partial<Prisma.video_session_commentCreateInput>
            | undefined;
          count?: number;
        }
      | undefined
  ): Prisma.video_session_commentCreateInput[] {
    const { overrides = {}, count = 1 } = options ?? {};

    return Array.from({ length: count }, () => this.create(overrides));
  }

  async createManyAndSave(
    options?:
      | {
          overrides?:
            | Partial<Prisma.video_session_commentCreateInput>
            | undefined;
          count?: number;
        }
      | undefined
  ): Promise<video_session_comment[]> {
    const { overrides = {}, count = 1 } = options ?? {};
    const commentDataArray = Array.from({ length: count }, () =>
      this.create(overrides)
    );
    const savedComments: video_session_comment[] = [];

    for (const commentData of commentDataArray) {
      const saved = await prisma.video_session_comment.create({
        data: commentData,
      });
      savedComments.push(saved);
    }

    return savedComments;
  }

  async delete(where: Prisma.video_session_commentWhereInput): Promise<void> {
    await prisma.video_session_comment.deleteMany({ where });
  }

  async deleteMany(
    where: Prisma.video_session_commentWhereInput
  ): Promise<void> {
    await prisma.video_session_comment.deleteMany({ where });
  }

  async cleanup(): Promise<void> {
    await prisma.video_session_comment.deleteMany({});
  }
}

const commentFactory = new CommentFactory();

export default commentFactory;

