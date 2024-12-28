import { DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { v4 } from 'uuid';
import s3Client from '../../database/clients/s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Readable } from 'stream';
import { wwsError } from '../../utils/wwsError';

type keys = 'pfp' | 'thumbnail';

interface s3APIOption {
  bucket_name?: string;
  key: string;
}

export async function uploadImage(prefix: keys, file: Express.Multer.File) {
  const uuid = v4();
  const key = prefix + '-' + uuid;

  const upload = new Upload({
    client: s3Client,
    params: {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      Body: file.buffer,
    },
  });

  await upload.done();

  return key;
}

export async function loadImage(option: s3APIOption) {
  const command = new GetObjectCommand({
    Bucket: option.bucket_name
      ? option.bucket_name
      : process.env.AWS_BUCKET_NAME,
    Key: option.key,
  });

  try {
    const res = await s3Client.send(command);

    // type declaration에서는 readable로 명시되어있지 않지만, readable이다.
    return res.Body as Readable;
  } catch (err) {
    throw new wwsError(404, 'can not found image');
  }
}

export async function deleteImage(option: s3APIOption) {
  const command = new DeleteObjectCommand({
    Bucket: option.bucket_name
      ? option.bucket_name
      : process.env.AWS_BUCKET_NAME,
    Key: option.key,
  });

  return await s3Client.send(command);
}
