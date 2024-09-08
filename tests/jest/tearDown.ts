import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.join(process.cwd(), '.env.test'),
});

import s3Client from '../../src/database/clients/s3';
import {
  DeleteObjectsCommand,
  ListObjectsCommand,
  ObjectIdentifier,
} from '@aws-sdk/client-s3';

async function deleteAllUploadedS3Object() {
  const getObjectKeys = new ListObjectsCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
  });

  const res = await s3Client.send(getObjectKeys);

  if (res.Contents) {
    const deleteObjectsCommand = new DeleteObjectsCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Delete: {
        Objects: res.Contents as ObjectIdentifier[],
      },
    });

    await s3Client.send(deleteObjectsCommand);
  }
}

export default deleteAllUploadedS3Object;
