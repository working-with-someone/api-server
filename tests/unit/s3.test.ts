import s3Client from '../../src/database/clients/s3';
import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

import fs from 'fs';

describe('Environment Variables', () => {
  test('Environment_Variables_Must_Declared', async () => {
    expect(process.env.AWS_REGION).toBeDefined();
    expect(process.env.AWS_BUCKET_NAME).toBeDefined();
    expect(process.env.AWS_IAM_ACCESS_KEY).toBeDefined();
    expect(process.env.AWS_IAM_SECRET_ACCESS_KEY).toBeDefined();
  });
});

describe('S3 Commands', () => {
  // read command test를 위한 pre upload object
  const readCommandTestObjectKey = 'test-object';
  const testImagePath = './tests/data/images/image.png';

  beforeAll(async () => {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: readCommandTestObjectKey,
      Body: testImagePath,
    });

    const res = await s3Client.send(command);
  });

  test('putObjectCommand', async () => {
    const key = 'test-putObjectCommand';

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: fs.createReadStream(testImagePath),
    });

    const res = await s3Client.send(command);
    expect(res.$metadata.httpStatusCode).toEqual(200);
  });

  test('putObjectCommand wrapped by Upload from @aws-sdk/lib-storage', async () => {
    const key = 'test-putObjectCommandWrappedByUpload';

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: key,
        Body: fs.createReadStream(testImagePath),
      },
    });

    const res = await upload.done();
    expect(res.$metadata.httpStatusCode).toEqual(200);
  });

  test('getObjectCommand_', async () => {
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: readCommandTestObjectKey,
    });

    const res = await s3Client.send(command);
    expect(res.$metadata.httpStatusCode).toEqual(200);
  });

  test('deleteObjectCommand', async () => {
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: readCommandTestObjectKey,
    });

    const res = await s3Client.send(command);
    expect(res.$metadata.httpStatusCode).toEqual(204);
  });
});
