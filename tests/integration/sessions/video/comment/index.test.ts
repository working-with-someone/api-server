import server from '../../../../../src';
import httpStatusCode from 'http-status-codes';
import { videoSessionFactory, commentFactory } from '../../../../factories';
import request from 'supertest';
import type { video_session_comment } from '@prisma/client';
import currUser from '../../../../data/curr-user';
import { user } from '@prisma/client';
import { userFactory } from '../../../../factories';
import prismaClient from '../../../../../src/database/clients/prisma';
import { PublicVideoSession } from '../../../../../src/types/contracts/video-session';

describe('Comment API', () => {
  beforeAll(async () => {
    await currUser.insert();
  });

  afterAll(async () => {
    await currUser.delete();
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Video_Session_Comment', () => {
    let videoSession: PublicVideoSession;
    let commentDisabledVideoSession: PublicVideoSession;
    let user1: user;

    beforeAll(async () => {
      user1 = await userFactory.createAndSave();
      videoSession = await videoSessionFactory.createAndSave();
      commentDisabledVideoSession = await videoSessionFactory.createAndSave({
        comment_enabled: false,
      });
    });

    afterAll(async () => {
      await userFactory.cleanup();
      await videoSessionFactory.cleanup();
      await commentFactory.cleanup();
    });

    describe('GET /session/video/:video_session_id/comment', () => {
      beforeAll(async () => {
        await commentFactory.createManyAndSave({
          count: 30,
          overrides: {
            video_session: {
              connect: { id: videoSession.id },
            },
          },
        });
      });

      afterAll(async () => {
        await commentFactory.cleanup();
      });

      test('Response_200', async () => {
        const res = await request(server).get(
          `/sessions/video/${videoSession.id}/comment`
        );

        expect(res.statusCode).toEqual(httpStatusCode.OK);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].video_session_id).toEqual(videoSession.id);
        expect(res.body.data[0].isLiked).toEqual(false);
      });

      describe('Sort', () => {
        test('Response_200_With_10_Comments_Sorted_By_Recent', async () => {
          const res = await request(server).get(
            `/sessions/video/${videoSession.id}/comment?per_page=10&sort=recent`
          );

          expect(res.statusCode).toEqual(httpStatusCode.OK);
          expect(res.body.data).toHaveLength(10);
          expect(res.body.pagination).toMatchObject({
            currPage: 1,
            per_page: 10,
            hasMore: true,
            prevPage: null,
            nextPage: 2,
          });
          expect(res.body.data).toEqual(
            [...res.body.data].sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            )
          );
        });

        test('Response_200_With_10_Comments_When_Sort_Is_Not_Provided', async () => {
          const res = await request(server).get(
            `/sessions/video/${videoSession.id}/comment?per_page=10`
          );

          expect(res.statusCode).toEqual(httpStatusCode.OK);
          expect(res.body.data).toHaveLength(10);
          expect(res.body.pagination).toMatchObject({
            currPage: 1,
            per_page: 10,
            hasMore: true,
            prevPage: null,
            nextPage: 2,
          });
        });

        test('Response_400_When_Sort_Value_Is_Invalid', async () => {
          const res = await request(server).get(
            `/sessions/video/${videoSession.id}/comment?per_page=10&sort=oldest`
          );

          expect(res.statusCode).toEqual(httpStatusCode.BAD_REQUEST);
        });

        test('Response_400_When_Sort_Value_Is_Empty_String', async () => {
          const res = await request(server).get(
            `/sessions/video/${videoSession.id}/comment?per_page=10&sort=`
          );

          expect(res.statusCode).toEqual(httpStatusCode.BAD_REQUEST);
        });
      });

      describe('Pagination', () => {
        test('Response_400_When_Page_Is_Zero', async () => {
          const res = await request(server).get(
            `/sessions/video/${videoSession.id}/comment?page=0&per_page=10`
          );

          expect(res.statusCode).toEqual(httpStatusCode.BAD_REQUEST);
        });

        test('Response_First_Page_With_Correct_Pagination_Meta_Data', async () => {
          const res = await request(server).get(
            `/sessions/video/${videoSession.id}/comment?page=1&per_page=10`
          );

          expect(res.statusCode).toEqual(httpStatusCode.OK);
          expect(res.body.data).toHaveLength(10);
          expect(res.body.pagination).toMatchObject({
            currPage: 1,
            per_page: 10,
            hasMore: true,
            prevPage: null,
            nextPage: 2,
          });
        });

        test('Response_Middle_Page_With_Correct_Pagination_Meta_Data', async () => {
          const res = await request(server).get(
            `/sessions/video/${videoSession.id}/comment?page=2&per_page=10`
          );

          expect(res.statusCode).toEqual(httpStatusCode.OK);
          expect(res.body.data).toHaveLength(10);
          expect(res.body.pagination).toMatchObject({
            currPage: 2,
            per_page: 10,
            hasMore: true,
            prevPage: 1,
            nextPage: 3,
          });
        });

        test('Response_Last_Page_With_Correct_Pagination_Meta_Data', async () => {
          const res = await request(server).get(
            `/sessions/video/${videoSession.id}/comment?page=3&per_page=10`
          );

          expect(res.statusCode).toEqual(httpStatusCode.OK);
          expect(res.body.data).toHaveLength(10);
          expect(res.body.pagination).toMatchObject({
            currPage: 3,
            per_page: 10,
            hasMore: false,
            prevPage: 2,
            nextPage: null,
          });
        });

        test('Response_Empty_Page_When_Page_Exceeds_Total_Pages', async () => {
          const res = await request(server).get(
            `/sessions/video/${videoSession.id}/comment?page=4&per_page=10`
          );

          expect(res.statusCode).toEqual(httpStatusCode.OK);
          expect(res.body.data).toHaveLength(0);
          expect(res.body.pagination).toMatchObject({
            currPage: 4,
            per_page: 10,
            hasMore: false,
            prevPage: 3,
            nextPage: null,
          });
        });
      });
    });

    describe('GET /session/video/:video_session_id/comment/:comment_id', () => {
      let comment: video_session_comment;

      beforeEach(async () => {
        comment = await commentFactory.createAndSave({
          video_session: {
            connect: { id: videoSession.id },
          },
        });
      });

      test('Response_200_With_Comment', async () => {
        const res = await request(server).get(
          `/sessions/video/${videoSession.id}/comment/${comment.id}`
        );

        expect(res.statusCode).toEqual(httpStatusCode.OK);
        expect(res.body.data).toHaveProperty('isLiked', false);
      });

      test('Response_404_When_Comment_Does_Not_Exist', async () => {
        const res = await request(server).get(
          `/sessions/video/${videoSession.id}/comment/99999`
        );

        expect(res.statusCode).toEqual(httpStatusCode.NOT_FOUND);
      });
    });

    describe('POST /session/video/:video_session_id/comment', () => {
      afterAll(async () => {
        await commentFactory.cleanup();
      });

      test('Response_201_With_Created_Comment', async () => {
        const res = await request(server)
          .post(`/sessions/video/${videoSession.id}/comment`)
          .send({ content: 'Test Comment' });

        expect(res.statusCode).toEqual(httpStatusCode.CREATED);
        expect(res.body.data).toHaveProperty(
          'video_session_id',
          videoSession.id
        );
        expect(res.body.data).toHaveProperty('user_id', currUser.id);
        expect(res.body.data).toHaveProperty('content', 'Test Comment');
        expect(res.body.data).toHaveProperty('isLiked', false);
      });

      test('Response_201_And_Must_Be_Incremented_Video_Session_Comment_Count', async () => {
        const videoSessionBefore = await prismaClient.video_session.findUnique({
          where: {
            id: videoSession.id,
          },
        });

        const res = await request(server)
          .post(`/sessions/video/${videoSession.id}/comment`)
          .send({ content: 'Test Comment' });

        expect(res.statusCode).toEqual(httpStatusCode.CREATED);

        const videoSessionAfter = await prismaClient.video_session.findUnique({
          where: {
            id: videoSession.id,
          },
        });

        expect(videoSessionAfter!.comment_count).toEqual(
          videoSessionBefore!.comment_count + 1
        );
      });

      test('Response_400_With_Empty_Content', async () => {
        const res = await request(server)
          .post(`/sessions/video/${videoSession.id}/comment`)
          .send({
            content: '',
          });

        expect(res.statusCode).toEqual(httpStatusCode.BAD_REQUEST);
      });

      test('Response_403_When_Comment_Is_Disabled', async () => {
        const disabledVideoSession = await videoSessionFactory.createAndSave({
          comment_enabled: false,
        });

        const res = await request(server)
          .post(`/sessions/video/${disabledVideoSession.id}/comment`)
          .send({ content: 'Test Comment' });

        expect(res.statusCode).toEqual(httpStatusCode.FORBIDDEN);

        await videoSessionFactory.delete({ id: disabledVideoSession.id });
      });

      test('Response_403_When_Comment_Is_Disabled', async () => {
        const res = await request(server)
          .post(`/sessions/video/${commentDisabledVideoSession.id}/comment`)
          .send({ content: 'Test Comment' });

        expect(res.statusCode).toEqual(httpStatusCode.FORBIDDEN);
      });
    });

    describe('DELETE /session/video/:video_session_id/comment/:comment_id', () => {
      let comment: video_session_comment;
      let otherUserComment: video_session_comment;

      beforeEach(async () => {
        comment = await commentFactory.createAndSave({
          video_session: {
            connect: { id: videoSession.id },
          },
        });

        otherUserComment = await commentFactory.createAndSave({
          video_session: {
            connect: { id: videoSession.id },
          },
          user: {
            connect: { id: user1.id },
          },
        });
      });

      afterAll(async () => {
        await commentFactory.cleanup();
      });

      test('Response_204', async () => {
        const res = await request(server).delete(
          `/sessions/video/${videoSession.id}/comment/${comment.id}`
        );

        expect(res.statusCode).toEqual(httpStatusCode.NO_CONTENT);
      });

      test('Response_204_And_Must_Be_Decremented_Video_Session_Comment_Count', async () => {
        const videoSessionBefore = await prismaClient.video_session.findUnique({
          where: {
            id: videoSession.id,
          },
        });

        const res = await request(server).delete(
          `/sessions/video/${videoSession.id}/comment/${comment.id}`
        );

        expect(res.statusCode).toEqual(httpStatusCode.NO_CONTENT);

        const videoSessionAfter = await prismaClient.video_session.findUnique({
          where: {
            id: videoSession.id,
          },
        });

        expect(videoSessionAfter!.comment_count).toEqual(
          videoSessionBefore!.comment_count - 1
        );
      });

      test('Response_404_When_Comment_Does_Not_Exist', async () => {
        const res = await request(server).delete(
          `/sessions/video/${videoSession.id}/comment/99999`
        );

        expect(res.statusCode).toEqual(httpStatusCode.NOT_FOUND);
      });

      test('Response_403_When_User_Is_Not_The_Owner_Of_The_Comment', async () => {
        const res = await request(server).delete(
          `/sessions/video/${videoSession.id}/comment/${otherUserComment.id}`
        );

        expect(res.statusCode).toEqual(httpStatusCode.FORBIDDEN);
      });
    });
  });
});
