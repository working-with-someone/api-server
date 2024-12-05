import prismaClient from '../../src/database/clients/prisma';
jest.unmock('../../src/database/clients/prisma.ts');
import testUserData from '../data/user.json';
import server from '../../src';
import request from 'supertest';
import fs from 'fs';
import { loadImage } from '../../src/lib/s3';
import { to } from '../../src/config/path.config';
import path from 'path';

describe('User API', () => {
  const currUser: Record<string, any> = { ...testUserData.users[0] };

  beforeAll(async () => {
    for (const user of testUserData.users) {
      await prismaClient.user.create({
        data: { ...user, pfp: { create: {} } },
      });
    }
  });

  afterAll(async () => {
    await prismaClient.user.deleteMany({});
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /users/:userId', () => {
    test('Response_200_With_Private_Current_User_Info', async () => {
      const res = await request(server).get(`/users/${currUser.id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.id).toEqual(currUser.id);
      expect(res.body.encrypted_password).toBeDefined();
    });

    test('Response_200_With_Public_User_Info', async () => {
      const user = testUserData.users[1];

      const res = await request(server).get(`/users/${user.id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.username).toEqual(user.username);
      expect(res.body.encrypted_password).toBeUndefined();
    });

    test('Response_404', async () => {
      const res = await request(server).get(
        `/users/${testUserData.notFoundUserId}`
      );

      expect(res.statusCode).toEqual(404);
    });

    test('Response_400_userId(?)', async () => {
      const res = await request(server)
        // string userId is invalid, userId must be number
        .get(`/users/${testUserData.invalidUserId}`);

      expect(res.statusCode).toEqual(400);
    });
  });

  describe('GET /users/self', () => {
    test('Response_200_With_Current_User', async () => {
      const user = await prismaClient.user.findUnique({
        where: { id: currUser.id },
      });
      const res = await request(server).get(`/users/self`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.encrypted_password).toEqual(user?.encrypted_password);
    });
  });

  describe('PUT /users/:userId', () => {
    describe('single request', () => {
      // update된 user의 정보를 복구한다.
      afterEach(async () => {
        await prismaClient.user.update({
          where: {
            id: testUserData.users[0].id,
          },
          data: {
            username: testUserData.users[0].username,
            pfp: {
              update: {
                ...testUserData.defaultPfp,
              },
            },
          },
        });
      });

      // current user의 username, pfp를 update하는 요청에
      // 200을 응답받아야한다.
      // response body의 username이 update되었어야한다.
      // response body의 pfp가 이전의 pfp와 같지 않아야한다. (== update 되었어야한다.)
      test('Response_200_With_Updated_Current_User_username(o)', async () => {
        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-Type', 'multipart/form-data')
          .field('username', testUserData.updateUser.username);

        expect(res.statusCode).toEqual(200);
        expect(res.body.username).toEqual(testUserData.updateUser.username);
      });

      test('Response_401', async () => {
        const res = await request(server)
          .put(`/users/${testUserData.users[1].id}`)
          .set('Content-Type', 'multipart/form-data')
          .field('username', testUserData.updateUser.username);

        expect(res.statusCode).toEqual(401);
      });

      test('Response_200_With_Updated_Current_User_username(o)_pfp(o)', async () => {
        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-Type', 'multipart/form-data')
          .field('username', testUserData.updateUser.username)
          .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

        expect(res.statusCode).toEqual(200);
        expect(res.body.username).toEqual(testUserData.updateUser.username);
        expect(res.body.pfp.curr).not.toEqual(testUserData.defaultPfp.curr);

        const pfpRes = await request(server).get(res.body.pfp.curr);

        expect(pfpRes.statusCode).toEqual(200);
      });

      test('Response_200_With_Updated_Current_User_username(o)_pfpToDefault(true)_pfp(o)', async () => {
        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-type', 'multipart/form-data')
          .field('username', testUserData.updateUser.username)
          .field('pfpToDefault', true)
          .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

        expect(res.statusCode).toEqual(200);
        expect(res.body.username).toEqual(testUserData.updateUser.username);
        expect(res.body.pfp.curr).toEqual(
          path.join(to.media.default.images, 'pfp')
        );
      });

      test('Response_200_With_Updated_Current_User_username(o)_pfpToDefault(false)_pfp(o)', async () => {
        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-Type', 'multipart/form-data')
          .field('username', testUserData.updateUser.username)
          .field('pfpToDefault', false)
          .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

        expect(res.statusCode).toEqual(200);
        expect(res.body.username).toEqual(testUserData.updateUser.username);

        const pfpRes = await request(server).get(res.body.pfp.curr);

        expect(pfpRes.statusCode).toEqual(200);
      });

      test('Response_200_With_Updated_Current_User_username(o)', async () => {
        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-type', 'multipart/form-data')
          .field('username', testUserData.updateUser.username);

        expect(res.statusCode).toEqual(200);
        expect(res.body.username).toEqual(testUserData.updateUser.username);
      });

      test('Response_200_With_Updated_Current_User_pfp(o)', async () => {
        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-type', 'multipart/form-data')
          .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

        expect(res.statusCode).toEqual(200);
        expect(res.body.pfp.curr).not.toEqual(testUserData.defaultPfp.curr);
      });
    });

    describe('continuous request', () => {
      afterAll(async () => {
        await prismaClient.user.update({
          where: {
            id: testUserData.users[0].id,
          },
          data: {
            username: testUserData.users[0].username,
            pfp: {
              update: {
                ...testUserData.defaultPfp,
              },
            },
          },
        });
      });

      let currUploadedPfpKey = '';

      // curr user의 username과 pfp를 새로운 image로 update한다.
      test('1. Response_200_With_Updated_Current_User_pfpToDefault(x)', async () => {
        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-Type', 'multipart/form-data')
          .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

        expect(res.statusCode).toEqual(200);

        // pfp가 default여선 안된다.
        expect(res.body.pfp.curr).not.toEqual(testUserData.defaultPfp.curr);

        // request 1 으로 인해 upload된 pfp key
        currUploadedPfpKey = res.body.pfp.curr;
      });

      // curr user의 pfp를 새로운 image로 update한다.
      test('2. Response_200_With_Updated_Current_User_And_Updated_Pfp_At_1_Must_Be_deleeted', async () => {
        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-Type', 'multipart/form-data')
          .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

        expect(res.statusCode).toEqual(200);

        // pfp가 default여선 안된다.
        expect(res.body.pfp.curr).not.toEqual(testUserData.defaultPfp.curr);

        // req1에서 upload되었던 pfp는 delete되었어야한다.
        expect(loadImage({ key: currUploadedPfpKey })).rejects.toThrow();

        // 두번째 req의 image가 upload되었어야함.

        const pfpRes = await request(server).get(res.body.pfp.curr);

        expect(pfpRes.statusCode).toEqual(200);

        currUploadedPfpKey = res.body.pfp.curr;
      });

      test('3. Response_200_With_Updated_Current_User_And_Updated_Default_Pfp_At_Req2_Must_Be_deleted', async () => {
        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-Type', 'multipart/form-data')
          .field('pfpToDefault', true);

        expect(res.statusCode).toEqual(200);

        expect(res.body.pfp.curr).toEqual(testUserData.defaultPfp.curr);

        // req1에서 upload되었던 pfp는 delete되었어야한다.
        expect(loadImage({ key: currUploadedPfpKey })).rejects.toThrow();
      });
    });
  });
});
