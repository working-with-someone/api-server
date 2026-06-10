import server from '../../../../src';
import httpStatusCode from 'http-status-codes';
import { videoSessionFactory, commentFactory } from '../../../factories';
import request from 'supertest';
import type { comment } from '@prisma/client';
import { VideoSessionWithAll } from '../../../../src/@types/video-session';

describe('Comment API', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('Video_Session_Comment', () => {
    let videoSession: VideoSessionWithAll;

    beforeAll(async () => {
      videoSession = await videoSessionFactory.createAndSave();
    });

    afterAll(async () => {
      await videoSessionFactory.cleanup();
      await commentFactory.cleanup();
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
  });
});
