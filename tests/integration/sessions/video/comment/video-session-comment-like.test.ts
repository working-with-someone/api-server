import server from '../../../../../src';
import httpStatusCodes from 'http-status-codes';
import request from 'supertest';
import currUser from '../../../../data/curr-user';
import videoSessionCommentLikeFactory from '../../../../factories/video-session-comment-like-factory';
import prismaClient from '../../../../../src/database/clients/prisma';
import { commentFactory, videoSessionFactory } from '../../../../factories';
import { PublicVideoSession } from '../../../../../src/types/contracts/video-session';
import { PublicVideoSessionComment } from '../../../../../src/types/contracts/comment';

describe('Video Session Comment Like API', () => {
  let videoSession: PublicVideoSession
  let videoSessionComment: PublicVideoSessionComment;

  beforeAll(async () => {
    await currUser.insert();

    videoSession = await videoSessionFactory.createAndSave({
      organizer: {
        connect: {
          id: currUser.id,
        },
      },
    });

    videoSessionComment = await commentFactory.createAndSave({
      video_session: {
        connect: {
          id: videoSession.id,
        },
      },
    });
  });

  afterAll(async () => {
    await videoSessionFactory.cleanup();
    await commentFactory.cleanup();

    await currUser.delete();
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /sessions/video/:video_session_id/comment/:comment_id/like', () => {
    beforeAll(async () => {
      await videoSessionCommentLikeFactory.createAndSave({
        video_session_comment: {
          connect: {
            id: videoSessionComment.id,
          },
        },
      });
    });

    afterAll(async () => {
      await videoSessionCommentLikeFactory.cleanup();
    });

    test(`Response_200_With_Likes`, async () => {
      const res = await request(server).get(
        `/sessions/video/${videoSession.id}/comment/${videoSessionComment.id}/like`
      );

      expect(res.statusCode).toEqual(httpStatusCodes.OK);
      expect(res.body.data.user_id).toEqual(currUser.id);
      expect(res.body.data.video_session_comment_id).toEqual(
        videoSessionComment.id.toString()
      );
    });

    test('Response_404_When_Like_Does_not_Exist', async () => {
      const notLikedVideoSessionComment = await commentFactory.createAndSave({
        video_session: {
          connect: {
            id: videoSession.id,
          },
        },
      });

      const res = await request(server).get(
        `/sessions/video/${videoSession.id}/comment/${notLikedVideoSessionComment.id}/like`
      );

      expect(res.statusCode).toEqual(httpStatusCodes.NOT_FOUND);
    });
  });

  describe('POST /sessions/video/:video_session_id/comment/:comment_id/like', () => {
    afterEach(async () => {
      await videoSessionCommentLikeFactory.cleanup();
    });

    test('Response_201_With_Created_Like', async () => {
      const res = await request(server).post(
        `/sessions/video/${videoSession.id}/comment/${videoSessionComment.id}/like`
      );

      expect(res.statusCode).toEqual(httpStatusCodes.CREATED);
      expect(res.body.data.user_id).toEqual(currUser.id);
      expect(res.body.data.video_session_comment_id).toEqual(
        videoSessionComment.id.toString()
      );
    });

    test('Response_201_With_Incremented_Video_Session_Comment_Like_Count', async () => {
      const videoSessionCommentBefore =
        await prismaClient.video_session_comment.findUnique({
          where: {
            id: videoSessionComment.id,
          },
        });

      const res = await request(server).post(
        `/sessions/video/${videoSession.id}/comment/${videoSessionComment.id}/like`
      );

      const videoSessionCommentAfter =
        await prismaClient.video_session_comment.findUnique({
          where: {
            id: videoSessionComment.id,
          },
        });

      expect(res.statusCode).toEqual(httpStatusCodes.CREATED);
      expect(videoSessionCommentAfter!.like_count).toEqual(
        videoSessionCommentBefore!.like_count + 1
      );
    });

    test('Response_409_When_Like_Already_Exists', async () => {
      await videoSessionCommentLikeFactory.createAndSave({
        video_session_comment: {
          connect: {
            id: videoSessionComment.id,
          },
        },
        user: {
          connect: {
            id: currUser.id,
          },
        },
      });

      const res = await request(server).post(
        `/sessions/video/${videoSession.id}/comment/${videoSessionComment.id}/like`
      );

      expect(res.statusCode).toEqual(httpStatusCodes.CONFLICT);
    });
  });

  describe('DELETE /sessions/video/:video_session_id/comment/:comment_id/like', () => {
    beforeEach(async () => {
      await videoSessionCommentLikeFactory.createAndSave({
        video_session_comment: {
          connect: {
            id: videoSessionComment.id,
          },
        },
        user: {
          connect: {
            id: currUser.id,
          },
        },
      });
    });

    afterEach(async () => {
      await videoSessionCommentLikeFactory.cleanup();
    });

    test('Response_209', async () => {
      const res = await request(server).delete(
        `/sessions/video/${videoSession.id}/comment/${videoSessionComment.id}/like`
      );

      expect(res.statusCode).toEqual(httpStatusCodes.NO_CONTENT);
    });

    test('Response_209_And_Decremented_Video_Session_Comment_Like_Count', async () => {
      const videoSessionCommentBefore =
        await prismaClient.video_session_comment.findUnique({
          where: {
            id: videoSessionComment.id,
          },
        });

      const res = await request(server).delete(
        `/sessions/video/${videoSession.id}/comment/${videoSessionComment.id}/like`
      );

      const videoSessionCommentAfter =
        await prismaClient.video_session_comment.findUnique({
          where: {
            id: videoSessionComment.id,
          },
        });

      expect(res.statusCode).toEqual(httpStatusCodes.NO_CONTENT);
      expect(videoSessionCommentAfter!.like_count).toEqual(
        videoSessionCommentBefore!.like_count - 1
      );
    });

    test('Response_404_When_Like_Does_Not_Exist', async () => {
      const notLikedVideoSessionComment = await commentFactory.createAndSave({
        user: {
          connect: {
            id: currUser.id,
          },
        },
        video_session: {
          connect: {
            id: videoSession.id,
          },
        },
      });

      const res = await request(server).get(
        `/sessions/video/${notLikedVideoSessionComment.id}/like`
      );

      expect(res.statusCode).toEqual(httpStatusCodes.NOT_FOUND);

      await commentFactory.cleanup();
    });
  });
});
