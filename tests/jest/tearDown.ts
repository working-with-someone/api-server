import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.posix.join(process.cwd(), '.env.test'),
});

import s3Client from '../../src/database/clients/s3';
import {
  DeleteObjectsCommand,
  ListObjectsCommand,
  ObjectIdentifier,
} from '@aws-sdk/client-s3';

/**
 * test과정에서 upload한 과정에서 s3 test storage에 upload한 모든 object들을 제거한다.
 */
async function deleteAllUploadedS3Object() {
  // test storage에 존재하는 모든 object를 가져온다.
  const getObjectKeys = new ListObjectsCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
  });

  const res = await s3Client.send(getObjectKeys);

  // object가 존재한다면, object들을 모두 제거한다.
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
