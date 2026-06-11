import server from '../../../../src';
import httpStatusCode from 'http-status-codes';
import { videoSessionFactory, commentFactory } from '../../../factories';
import request from 'supertest';
import type { comment } from '@prisma/client';
import { VideoSessionWithAll } from '../../../../src/@types/video-session';
import currUser from '../../../data/curr-user';

describe('Comment API', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('Video_Session_Comment', () => {
    let videoSession: VideoSessionWithAll;
    let commentDisabledVideoSEssion: VideoSessionWithAll;

    beforeAll(async () => {
      videoSession = await videoSessionFactory.createAndSave();
      commentDisabledVideoSEssion = await videoSessionFactory.createAndSave({
        comment_enabled: false,
      });
    });

    afterAll(async () => {
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

      test('Response_200_With_1_Comments', async () => {
        const res = await request(server).get(
          `/sessions/video/${videoSession.id}/comment`
        );

        expect(res.statusCode).toEqual(httpStatusCode.OK);
        expect(res.body.data).toHaveLength(1);
      });

      test('Response_200_With_10_Comments', async () => {
        const res = await request(server).get(
          `/sessions/video/${videoSession.id}/comment?per_page=10`
        );

        expect(res.statusCode).toEqual(httpStatusCode.OK);
        expect(res.body.data).toHaveLength(10);
      });

      test('Response_200_With_10_Comments_Sorted_By_Recent', async () => {
        const res = await request(server).get(
          `/sessions/video/${videoSession.id}/comment?per_page=10&sort=recent`
        );

        expect(res.statusCode).toEqual(httpStatusCode.OK);
        expect(res.body.data).toHaveLength(10);
        expect(res.body.data).toEqual(
          [...res.body.data].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        );
      });
    });

    describe('GET /session/video/:video_session_id/comment/:comment_id', () => {
      let comment: comment;

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

      test('Response_200_With_Created_Comment', async () => {
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
          .post(`/sessions/video/${commentDisabledVideoSEssion.id}/comment`)
          .send({ content: 'Test Comment' });

        expect(res.statusCode).toEqual(httpStatusCode.FORBIDDEN);
      });
    });
  });
});
