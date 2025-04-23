import server from '../../src';
import request from 'supertest';
import s3Client from '../../src/database/clients/s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

describe('Media API', () => {
  afterAll((done) => {
    server.close(done);
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
        const res = await request(server).get(
          `/media/images/${uploadedImageKey}`
        );

        expect(res.statusCode).toEqual(200);
      });

      test('Response_404_key(does_not_exist)', async () => {
        const res = await request(server).get(`/media/images/deosNotExist'`);

        expect(res.statusCode).toEqual(404);
      });
    });

    describe('GET /media/images/default/:key', () => {
      const defaultPfpImageKey = 'pfp';

      test('Response_200_With_Image', async () => {
        const res = await request(server).get(
          `/media/images/default/${defaultPfpImageKey}`
        );

        expect(res.statusCode).toEqual(200);
      });

      test('Response_400', async () => {
        const res = await request(server).get(
          `/media/images/default/doesNotExistDefaultObjectKey`
        );

        expect(res.statusCode).toEqual(404);
      });
    });
  });
});
