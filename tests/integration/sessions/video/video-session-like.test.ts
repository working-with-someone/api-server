import server from '../../../../src';
import httpStatusCode from 'http-status-codes';
import request from 'supertest';
import currUser from '../../../data/curr-user';
import { videoSessionFactory } from '../../../factories';
import { VideoSessionWithAll } from '../../../../src/@types/video-session';
import likeFactory from '../../../factories/video-session-like-factory';

describe('Like API', () => {
  beforeAll(async () => {
    await currUser.insert();
  });

  afterAll(async () => {
    await currUser.delete();
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Video_Session_Like', () => {
    let videoSession: VideoSessionWithAll;

    beforeAll(async () => {
      videoSession = await videoSessionFactory.createAndSave();
    });

    afterAll(async () => {
      await videoSessionFactory.cleanup();
    });

    describe('GET /session/video/:video_session_id/like', () => {
      beforeAll(async () => {
        await likeFactory.createAndSave({
          user: { connect: { id: currUser.id } },
          video_session: { connect: { id: videoSession.id } },
        });
      });

      afterAll(async () => {
        await likeFactory.cleanup();
      });

      test('Response_200_With_Likes', async () => {
        const res = await request(server).get(
          `/sessions/video/${videoSession.id}/like`
        );

        expect(res.statusCode).toEqual(httpStatusCode.OK);
        expect(res.body.data.user_id).toEqual(currUser.id);
        expect(res.body.data.video_session_id).toEqual(videoSession.id);
      });

      test('Response_404_When_Like_Does_Not_Exist', async () => {
        const notLikedVideoSession = await videoSessionFactory.createAndSave({
          organizer: {
            connect: {
              id: currUser.id,
            },
          },
        });

        const res = await request(server).get(
          `/sessions/video/${notLikedVideoSession.id}/like`
        );

        expect(res.statusCode).toEqual(httpStatusCode.NOT_FOUND);
      });
    });

    describe('POST /session/video/:video_session_id/like', () => {
      afterEach(async () => {
        await likeFactory.cleanup();
      });

      test('Response_201_With_Created_Like', async () => {
        const res = await request(server)
          .post(`/sessions/video/${videoSession.id}/like`)
          .send();

        expect(res.statusCode).toEqual(httpStatusCode.CREATED);
        expect(res.body.data.user_id).toEqual(currUser.id);
      });

      test('Response_409_When_Like_Already_Exists', async () => {
        await likeFactory.createAndSave({
          video_session: {
            connect: {
              id: videoSession.id,
            },
          },
          user: {
            connect: {
              id: currUser.id,
            },
          },
        });

        const res = await request(server).post(
          `/sessions/video/${videoSession.id}/like`
        );

        expect(res.statusCode).toEqual(httpStatusCode.CONFLICT);
      });
    });

    describe('DELETE /session/video/:video_session_id/like', () => {
      beforeAll(async () => {
        await likeFactory.createAndSave({
          user: { connect: { id: currUser.id } },
          video_session: { connect: { id: videoSession.id } },
        });
      });

      afterAll(async () => {
        await likeFactory.cleanup();
      });

      test('Response_209', async () => {
        const res = await request(server).delete(
          `/sessions/video/${videoSession.id}/like`
        );

        expect(res.statusCode).toEqual(httpStatusCode.NO_CONTENT);
      });

      test('Response_404_When_Like_Does_Not_Exist', async () => {
        const notLikedVideoSession = await videoSessionFactory.createAndSave({
          organizer: {
            connect: {
              id: currUser.id,
            },
          },
        });

        const res = await request(server).get(
          `/sessions/video/${notLikedVideoSession.id}/like`
        );

        expect(res.statusCode).toEqual(httpStatusCode.NOT_FOUND);
      });
    });
  });
});
