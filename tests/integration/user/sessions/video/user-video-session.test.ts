import request from 'supertest';
import { access_level, user } from '@prisma/client';
import server from '../../../../../src';
import currUser from '../../../../data/curr-user';
import { userFactory } from '../../../../factories';
import { videoSessionFactory } from '../../../../factories/video-session-factory';
import { VideoSessionWithAll } from '../../../../../src/@types/video-session';
import prismaClient from '../../../../../src/database/clients/prisma';

describe('User Video Session API', () => {
    let otherUser: user;

    beforeAll(async () => {
        otherUser = await userFactory.createAndSave();
        await currUser.insert();
    });


    afterEach(async () => {
        await videoSessionFactory.cleanup();
    });

    afterAll(async () => {
        await currUser.delete();
    });

    afterAll((done) => {
        server.close(done);
    });

    describe('GET /users/:user_id/sessions/video', () => {
        afterEach(async () => {
            await videoSessionFactory.cleanup();
            await prismaClient.follow.deleteMany({});
        })

        test('Response_200_With_Current_User_Public_Video_Sessions', async () => {
            await videoSessionFactory.createAndSave({
                organizer: { connect: { id: currUser.id } },
                access_level: access_level.PUBLIC
            });

            const res = await request(server).get(`/users/${currUser.id}/sessions/video`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toEqual(1);

            for (const videoSession of res.body.data) {
                expect(videoSession.organizer_id).toEqual(currUser.id);
            }
        });

        test('Response_200_With_Other_User_Public_Video_Session', async () => {
            await videoSessionFactory.createAndSave({
                organizer: { connect: { id: otherUser.id } },
                access_level: access_level.PUBLIC
            });

            const res = await request(server).get(`/users/${otherUser.id}/sessions/video`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toEqual(1);
        })

        test('Response_200_WIth_100_Video_Sessions', async () => {
            await videoSessionFactory.createManyAndSave({
                count: 23,
                overrides: {
                    organizer: { connect: { id: currUser.id } },
                    access_level: access_level.PUBLIC
                },
            });

            const res = await request(server).get(`/users/${currUser.id}/sessions/video?page=1&per_page=10`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toEqual(10);
        })

        // user는 본인의 private video session을 가져올 수 있다.
        test('Response_200_With_Current_User_Private_Video_Session', async () => {
            await videoSessionFactory.createAndSave({
                organizer: { connect: { id: currUser.id } },
                access_level: "PRIVATE"
            });

            const res = await request(server).get(`/users/${currUser.id}/sessions/video`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toEqual(1);
        })

        // user는 본인이 allowed 되어있는 다른 user의 private video session을 가져올 수 있다.
        test('Response_200_With_Allowed_Other_User_Private_Video_Session', async () => {
            const otherUserPrivateVideoSession = await videoSessionFactory.createAndSave({
                organizer: { connect: { id: otherUser.id } },
                access_level: "PRIVATE"
            });

            await prismaClient.video_session_allow.create({
                data: {
                    user_id: currUser.id,
                    video_session_id: otherUserPrivateVideoSession.id
                }
            });

            const res = await request(server).get(`/users/${otherUser.id}/sessions/video`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toEqual(1);
        })

        // user는 본인이 allowed 되어있지 않은 다른 user의 private video session을 가져올 수 없다.
        test('Response_200_With_Empty_Array_About_Not_Allowed_Other_User_Private_Video_Session', async () => {
            await videoSessionFactory.createAndSave({
                organizer: { connect: { id: otherUser.id } },
                access_level: "PRIVATE"
            });

            const res = await request(server).get(`/users/${currUser.id}/sessions/video`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toEqual(0);
        });

        // user는 본인의 follower only video session을 가져올 수 있다.
        test('Response_200_With_Current_User_Follower_Only_Video_Session', async () => {
            await videoSessionFactory.createAndSave({
                organizer: { connect: { id: currUser.id } },
                access_level: access_level.PRIVATE
            });

            const res = await request(server).get(`/users/${currUser.id}/sessions/video`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toEqual(1);
        })

        // user는 본인이 follow한 user의 follower only video session을 가져올 수 있다.
        test('Response_200_With_Other_User_Follower_Only_Video_Session', async () => {
            await videoSessionFactory.createAndSave({
                organizer: { connect: { id: otherUser.id } },
                access_level: access_level.FOLLOWER_ONLY
            });

            await prismaClient.follow.create({
                data: {
                    following_user_id: otherUser.id,
                    follower_user_id: currUser.id
                }
            });

            const res = await request(server).get(`/users/${otherUser.id}/sessions/video`);

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body.data)).toBe(true);
            expect(res.body.data.length).toEqual(1);
        })

        // user는 본인이 follow하지 않은 user의 follower only video session을 가져올 수 없다.
        test('Response_200_With_Empty_Array_About_Other_User_Follower_Only_Video_Session', async () => {
            await videoSessionFactory.createAndSave({
                organizer: { connect: { id: otherUser.id } },
                access_level: access_level.FOLLOWER_ONLY
            });

            const res = await request(server).get(`/users/${otherUser.id}/sessions/video`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.length).toEqual(0);
        })

        test('Response_400_user_id(?)', async () => {
            const res = await request(server).get('/users/userIdMustBeNumber/sessions/video');

            expect(res.statusCode).toEqual(400);
        });
    })

    describe('GET /users/:user_id/sessions/video/:video_session_id', () => {
        afterEach(async () => {
            await videoSessionFactory.cleanup();
            await prismaClient.follow.deleteMany({});
        })

        test('Response_200_With_Current_User_Public_Video_Session', async () => {
            const videoSession = await videoSessionFactory.createAndSave({
                organizer: { connect: { id: currUser.id } },
                access_level: access_level.PUBLIC
            });

            const res = await request(server).get(`/users/${currUser.id}/sessions/video/${videoSession.id}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.id).toEqual(videoSession.id);
        })

        test('Response_200_With_Other_User_Public_Video_Session', async () => {
            const videoSession = await videoSessionFactory.createAndSave({
                organizer: { connect: { id: otherUser.id } },
                access_level: access_level.PUBLIC
            });

            const res = await request(server).get(`/users/${otherUser.id}/sessions/video/${videoSession.id}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.id).toEqual(videoSession.id);
        })

        test('Response_200_With_Current_User_Private_Video_Session', async () => {
            const videoSession = await videoSessionFactory.createAndSave({
                organizer: { connect: { id: currUser.id } },
                access_level: access_level.PRIVATE
            });

            const res = await request(server).get(`/users/${currUser.id}/sessions/video/${videoSession.id}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.id).toEqual(videoSession.id);
        })

        test('Response_200_With_Allowed_Other_User_Private_Video_Session', async () => {
            const videoSession = await videoSessionFactory.createAndSave({
                organizer: { connect: { id: otherUser.id } },
                access_level: access_level.PRIVATE
            });

            await prismaClient.video_session_allow.create({
                data: {
                    user_id: currUser.id,
                    video_session_id: videoSession.id
                }
            });

            const res = await request(server).get(`/users/${otherUser.id}/sessions/video/${videoSession.id}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.id).toEqual(videoSession.id);
        })

        test('Response_403_With_Not_Allowed_Other_User_Private_Video_Session', async () => {
            const videoSession = await videoSessionFactory.createAndSave({
                organizer: { connect: { id: otherUser.id } },
                access_level: access_level.PRIVATE
            });

            const res = await request(server).get(`/users/${otherUser.id}/sessions/video/${videoSession.id}`);

            expect(res.statusCode).toEqual(403);
        })

        test('Response_200_With_Current_User_Follower_Only_Video_Session', async () => {
            const videoSession = await videoSessionFactory.createAndSave({
                organizer: { connect: { id: currUser.id } },
                access_level: access_level.FOLLOWER_ONLY
            });

            const res = await request(server).get(`/users/${currUser.id}/sessions/video/${videoSession.id}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.id).toEqual(videoSession.id);
        })

        test('Response_200_With_Other_User_Follower_Only_Video_Session_When_Following', async () => {
            const videoSession = await videoSessionFactory.createAndSave({
                organizer: { connect: { id: otherUser.id } },
                access_level: access_level.FOLLOWER_ONLY
            });

            await prismaClient.follow.create({
                data: {
                    following_user_id: otherUser.id,
                    follower_user_id: currUser.id
                }
            });

            const res = await request(server).get(`/users/${otherUser.id}/sessions/video/${videoSession.id}`);

            expect(res.statusCode).toEqual(200);
            expect(res.body.data.id).toEqual(videoSession.id);
        })

        test('Response_403_With_Other_User_Follower_Only_Video_Session_When_Not_Following', async () => {
            const videoSession = await videoSessionFactory.createAndSave({
                organizer: { connect: { id: otherUser.id } },
                access_level: access_level.FOLLOWER_ONLY
            });

            const res = await request(server).get(`/users/${otherUser.id}/sessions/video/${videoSession.id}`);

            expect(res.statusCode).toEqual(403);
        })

        test('Response_400_user_id(?)', async () => {
            const videoSession = await videoSessionFactory.createAndSave({
                organizer: { connect: { id: currUser.id } },
                access_level: access_level.PUBLIC
            });

            const res = await request(server).get(`/users/userIdMustBeNumber/sessions/video/${videoSession.id}`);

            expect(res.statusCode).toEqual(400);
        })

        test('Response_404_Non_Existent_Video_Session', async () => {
            const videoSession = await videoSessionFactory.createAndSave({
                organizer: { connect: { id: currUser.id } },
                access_level: access_level.PUBLIC
            });

            const res = await request(server).get(`/users/${currUser.id}/sessions/video/999999`);

            expect(res.statusCode).toEqual(404);
        })
    })
});

