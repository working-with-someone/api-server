import prismaClient from '../../src/database/clients/prisma';
jest.unmock('../../src/database/clients/prisma.ts');

import testUserData from '../data/user.json';
import redisClient from '../../src/database/clients/redis';
import app from '../../src/app';
import { getPublicUserInfo } from '../../src/services/user.service';
import express from 'express';
import request from 'supertest';
import session from 'express-session';
import sessionConfig from '../../src/config/session.config';
import fs from 'fs';
import { loadImage } from '../../src/lib/s3';

const currUser = { ...testUserData.users[0] };

const mockApp = express();

// session object가 생성되도록한다.
mockApp.use(session(sessionConfig));

// 모든 request에 대해 session object에 userId property를 지정한다.
// authentication을 수행하는 auth middleware를 우회하기 위함이다.
mockApp.all('*', (req, res, next) => {
  req.session.userId = currUser.id;
  next();
});

mockApp.use(app);

describe('User API', () => {
  const currUser: Record<string, any> = { ...testUserData.users[0] };

  beforeAll(async () => {
    for (const user of testUserData.users) {
      await prismaClient.user.create({
        data: { ...user, pfp: { create: {} } },
      });
    }
    await redisClient.connect();
  });

  afterAll(async () => {
    await prismaClient.user.deleteMany({});
    await redisClient.disconnect();
  });

  describe('GET /users/:userId', () => {
    test('Response_200_With_Public_Current_User_Info', async () => {
      const res = await request(mockApp).get(`/users/${currUser.id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toEqual(getPublicUserInfo(currUser));
    });

    test('Response_200_With_Public_User_Info', async () => {
      const user = testUserData.users[1];

      const res = await request(mockApp).get(`/users/${user.id}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toEqual(getPublicUserInfo(user));
    });

    test('Response_404', async () => {
      const res = await request(mockApp).get(
        `/users/${testUserData.notFoundUserId}`
      );

      expect(res.statusCode).toEqual(404);
    });

    test('Response_400_userId(?)', async () => {
      const res = await request(mockApp)
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
      const res = await request(mockApp).get(`/users/self`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.encrypted_password).toEqual(user?.encrypted_password);
    });
  });

  describe('PUT /users/self', () => {
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
    test('Response_200_With_Updated_Current_User', async () => {
      const res = await request(mockApp)
        .put('/users/self')
        .set('Content-Type', 'multipart/form-data')
        .field('username', testUserData.updateUser.username)
        .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

      expect(res.statusCode).toEqual(200);
      expect(res.body.user.username).toEqual(testUserData.updateUser.username);
      expect(res.body.user.pfp.curr).not.toEqual(testUserData.defaultPfp.curr);
    });

    // current user의 username, pfp를 update하는 요청에
    // 200을 응답받아야한다.
    // response body의 username이 update되었어야한다.
    // response body의 pfp가 이전의 pfp와 같지 않아야한다. (== update 되었어야한다.)
    // 두번째 pfp를 update하는 요청에
    // 첫번째 req에 upload되었던 pfp가 delete되어야한다.
    // 두번째 req에 update한 pfp가 upload되었어야한다.
    test('Response_200_With_Updated_Current_User_And_Check_S3_Object', async () => {
      // 첫번째 request
      const res1 = await request(mockApp)
        .put('/users/self')
        .set('Content-Type', 'multipart/form-data')
        .field('username', testUserData.updateUser.username)
        .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

      expect(res1.statusCode).toEqual(200);
      expect(res1.body.user.username).toEqual(testUserData.updateUser.username);
      expect(res1.body.user.pfp.curr).not.toEqual(testUserData.defaultPfp.curr);

      const pfp1Key = res1.body.user.pfp.curr;

      // 첫번째 req의 image가 upload되었어야함.
      expect(
        loadImage({
          key: pfp1Key,
        })
      ).resolves.not.toThrow();

      // 두번째 request
      const res2 = await request(mockApp)
        .put('/users/self')
        .set('Content-Type', 'multipart/form-data')
        .field('username', testUserData.updateUser.username)
        .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

      expect(res2.statusCode).toEqual(200);
      expect(res2.body.user.username).toEqual(testUserData.updateUser.username);
      expect(res2.body.user.pfp.curr).not.toEqual(testUserData.defaultPfp.curr);

      // 두번째 req의 image가 upload되었어야함.
      expect(
        loadImage({
          key: res2.body.user.pfp.curr,
        })
      ).resolves.not.toThrow();
    });

    // current user의 username을 update하는 요청에
    // 200을 응답받아야한다.
    // response body의 username이 update되었어야한다.
    test('Response_200_With_Updated_Current_User_pfp(x)', async () => {
      const res = await request(mockApp)
        .put('/users/self')
        .set('Content-type', 'multipart/form-data')
        .field('username', testUserData.updateUser.username);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user.username).toEqual(testUserData.updateUser.username);
    });

    // current user의 pfp를 update하는 요청에
    // 200을 응답받아야한다.
    // response body의 pfp가 이전의 pfp와 같지 않아야한다.
    test('Response_200_With_Updated_Current_User_username(x)', async () => {
      const res = await request(mockApp)
        .put('/users/self')
        .set('Content-type', 'multipart/form-data')
        .attach('pfp', fs.createReadStream('./tests/data/images/image.png'));

      expect(res.statusCode).toEqual(200);
      expect(res.body.user.pfp.curr).not.toEqual(testUserData.defaultPfp.curr);
    });
  });
});
