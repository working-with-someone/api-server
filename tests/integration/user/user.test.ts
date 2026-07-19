import prismaClient from '../../../src/database/clients/prisma';
import server from '../../../src';
import request from 'supertest';
import fs from 'fs';
import { loadImage } from '../../../src/lib/s3';
import { to } from '../../../src/config/path.config';
import path from 'path';
import currUser from '../../data/curr-user';
import { userFactory } from '../../factories';
import { user } from '../../../prisma/generated/prisma/client';

describe('User API', () => {
  let otherUser1: user;

  beforeAll(async () => {
    await currUser.insert();
    otherUser1 = await userFactory.createAndSave();
  });

  afterAll(async () => {
    await currUser.delete();
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /users/:userId', () => {
    test('Response_200_With_Private_Current_User_Info', async () => {
      const res = await request(server).get(`/users/${currUser.id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.id).toEqual(currUser.id);
      expect(res.body.data.encrypted_password).toBeUndefined();
    });

    test('Response_200_With_Public_User_Info', async () => {
      const res = await request(server).get(`/users/${otherUser1.id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.username).toEqual(otherUser1.username);
      expect(res.body.data.encrypted_password).toBeUndefined();
    });

    test('Response_404', async () => {
      const res = await request(server).get(`/users/0`);

      expect(res.statusCode).toEqual(404);
    });

    test('Response_400_userId(?)', async () => {
      const res = await request(server)
        // string userId is invalid, userId must be number
        .get(`/users/userIdMustBeNumber`);

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
    });
  });

  describe('PUT /users/:userId', () => {
    describe('single request', () => {
      afterEach(async () => {
        await currUser.restore();
      });
      // current user??username, pfp瑜?update?섎뒗 ?붿껌??
      // 200???묐떟諛쏆븘?쇳븳??
      // response body??username??update?섏뿀?댁빞?쒕떎.
      // response body??pfp媛 ?댁쟾??pfp? 媛숈? ?딆븘?쇳븳?? (== update ?섏뿀?댁빞?쒕떎.)
      test('Response_200_With_Updated_Current_User_username(o)', async () => {
        const newUsername = 'newUsername';
        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-Type', 'multipart/form-data')
          .field('username', newUsername);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.username).toEqual(newUsername);
      });

      // other user??username??update?섎뒗 ?붿쿂??403???묐떟諛쏆븘?쇳븳??
      test('Response_403', async () => {
        const newUsername = 'newUsername';

        const res = await request(server)
          .put(`/users/${otherUser1.id}`)
          .set('Content-Type', 'multipart/form-data')
          .field('username', newUsername);

        expect(res.statusCode).toEqual(403);
      });

      test('Response_200_With_Updated_Current_User_username(o)_pfp(o)', async () => {
        const newUsername = 'newUsername';

        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-Type', 'multipart/form-data')
          .field('username', newUsername)
          .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.username).toEqual(newUsername);
        expect(res.body.data.pfp.curr).not.toEqual(currUser.pfp.curr);

        const pfpRes = await request(server).get(res.body.data.pfp.curr);

        expect(pfpRes.statusCode).toEqual(200);
      });

      test('Response_200_With_Updated_Current_User_username(o)_pfpToDefault(true)_pfp(o)', async () => {
        const newUsername = 'newUsername';

        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-type', 'multipart/form-data')
          .field('username', newUsername)
          .field('pfpToDefault', true)
          .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.username).toEqual(newUsername);
        expect(res.body.data.pfp.curr).toEqual(
          path.posix.join(to.media.default.images, 'pfp')
        );
      });

      test('Response_200_With_Updated_Current_User_username(o)_pfpToDefault(false)_pfp(o)', async () => {
        const newUsername = 'newUsername';

        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-Type', 'multipart/form-data')
          .field('username', newUsername)
          .field('pfpToDefault', false)
          .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.username).toEqual(newUsername);

        const pfpRes = await request(server).get(res.body.data.pfp.curr);

        expect(pfpRes.statusCode).toEqual(200);
      });

      test('Response_200_With_Updated_Current_User_username(o)', async () => {
        const newUsername = 'newUsername';

        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-type', 'multipart/form-data')
          .field('username', newUsername);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.username).toEqual(newUsername);
      });

      test('Response_200_With_Updated_Current_User_pfp(o)', async () => {
        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-type', 'multipart/form-data')
          .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.pfp.curr).not.toEqual(currUser.pfp.curr);
      });
    });

    describe('continuous request', () => {
      let uploadedPfpKey = '';

      // curr user??username怨?pfp瑜??덈줈??image濡?update?쒕떎.
      test('1. Response_200_With_Updated_Current_User_pfpToDefault(x)', async () => {
        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-Type', 'multipart/form-data')
          .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

        expect(res.statusCode).toEqual(200);

        // pfp媛 default?ъ꽑 ?덈맂??
        expect(res.body.data.pfp.curr).not.toEqual(currUser.pfp.curr);

        // request 1 ?쇰줈 ?명빐 upload??pfp key
        uploadedPfpKey = res.body.data.pfp.curr;
      });

      // curr user??pfp瑜??덈줈??image濡?update?쒕떎.
      test('2. Response_200_With_Updated_Current_User_And_Updated_Pfp_At_1_Must_Be_deleeted', async () => {
        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-Type', 'multipart/form-data')
          .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

        expect(res.statusCode).toEqual(200);

        // pfp媛 default?ъ꽑 ?덈맂??
        expect(res.body.data.pfp.curr).not.toEqual(currUser.pfp.curr);

        // req1?먯꽌 upload?섏뿀??pfp??delete?섏뿀?댁빞?쒕떎.
        expect(loadImage({ key: uploadedPfpKey })).rejects.toThrow();

        // ?먮쾲吏?req??image媛 upload?섏뿀?댁빞??

        const pfpRes = await request(server).get(res.body.data.pfp.curr);

        expect(pfpRes.statusCode).toEqual(200);

        uploadedPfpKey = res.body.data.pfp.curr;
      });

      test('3. Response_200_With_Updated_Current_User_And_Updated_Default_Pfp_At_Req2_Must_Be_deleted', async () => {
        const res = await request(server)
          .put(`/users/${currUser.id}`)
          .set('Content-Type', 'multipart/form-data')
          .field('pfpToDefault', true);

        expect(res.statusCode).toEqual(200);

        expect(res.body.data.pfp.curr).toEqual(currUser.pfp.curr);

        // req1?먯꽌 upload?섏뿀??pfp??delete?섏뿀?댁빞?쒕떎.
        expect(loadImage({ key: uploadedPfpKey })).rejects.toThrow();
      });
    });
  });
});

