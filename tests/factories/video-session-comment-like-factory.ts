import {
  Prisma,
  PrismaClient,
  video_session_comment_like,
} from '@prisma/client';
import { IFactory } from './factory';
import currUser from '../data/curr-user';

const prismaClient = new PrismaClient();

type CreateInput = {
  user?: Prisma.video_session_likeCreateInput['user'];
  video_session_comment: NonNullable<
    Prisma.video_session_comment_likeCreateInput['video_session_comment']
  >;
};

class VideoSessionCommentLikeFactory
  implements IFactory<CreateInput, video_session_comment_like>
{
  create(overrides: CreateInput): Prisma.video_session_comment_likeCreateInput {
    return {
      user: overrides.user || { connect: { id: currUser.id } },
      video_session_comment: overrides.video_session_comment,
    };
  }
  createAndSave(overrides: CreateInput): Promise<video_session_comment_like> {
    const data = this.create(overrides);

    return prismaClient.video_session_comment_like.create({
      data,
    });
  }

  async cleanup(): Promise<void> {
    await prismaClient.video_session_comment_like.deleteMany();
  }
}

const videoSessionCommentLikeFactory = new VideoSessionCommentLikeFactory();

export default videoSessionCommentLikeFactory;
