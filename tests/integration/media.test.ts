import prismaClient from '../../src/database/clients/prisma';
jest.unmock('../../src/database/clients/prisma.ts');

import app from '../../src/app';
import request from 'supertest';
import session from 'express-session';
import sessionConfig from '../../src/config/session.config';
import testUserData from '../data/user.json';
import express from 'express';
import s3Client from '../../src/database/clients/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

const currUser = { ...testUserData.users[0] };

const mockApp = express();

mockApp.use(session(sessionConfig));

mockApp.all('*', (req, res, next) => {
  req.session.userId = currUser.id;
  next();
});

mockApp.use(app);

describe('Media API', () => {
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

  describe('Images', () => {
    describe('GET /media/images/:key', () => {
      const uploadedImageKey = 'media-test-key';

      beforeAll(async () => {
        const uploadImageCommand = new PutObjectCommand({
          Bucket: process.env.AWS_BUCKET_NAME,
          Key: uploadedImageKey,
          Body: fs.createReadStream('./tests/data/images/image.png'),
        });

        await s3Client.send(uploadImageCommand);
      });

      test('Response_200_With_Image', async () => {
        const res = await request(mockApp).get(
          `/media/images/${uploadedImageKey}`
        );

        expect(res.statusCode).toEqual(200);
      });

      test('Response_404_key(does_not_exist)', async () => {
        const res = await request(mockApp).get(`/media/images/deosNotExist'`);

        expect(res.statusCode).toEqual(404);
      });
    });
  });
});
