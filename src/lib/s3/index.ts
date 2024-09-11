import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 } from 'uuid';
import s3Client from '../../database/clients/s3';
import { File } from '../../middleware/minions';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { wwsError } from '../../utils/wwsError';

type keys = 'pfp';

export async function uploadImage(prefix: keys, file: File) {
  const uuid = v4();
  const key = prefix + '-' + uuid;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.stream,
      ContentType: file.mimetype,
    },
  });

  await upload.done();

  return key;
}

export async function loadImage(key: string) {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  try {
    const res = await s3Client.send(command);

    // type declaration에서는 readable로 명시되어있지 않지만, readable이다.
    return res.Body as Readable;
  } catch (err) {
    throw new wwsError(404, 'can not found image');
  }
}

export async function deleteImage(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: key,
  });

  return await s3Client.send(command);
}
