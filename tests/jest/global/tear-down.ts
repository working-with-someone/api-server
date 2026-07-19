import dotenv from 'dotenv';
import path from 'path';
import prismaClient from '../../../src/database/clients/prisma';
import s3Client from '../../../src/database/clients/s3';
import {
  DeleteObjectsCommand,
  ListObjectsCommand,
  ObjectIdentifier,
} from '@aws-sdk/client-s3';

dotenv.config({
  path: path.posix.join(process.cwd(), '.env.test'),
});

async function tearDown() {
  await deleteAllUploadedS3Object();
  await clearDatabase();
}

const clearDatabase = async () => {
  const initialCounts = await getTableCounts();

  await prismaClient.live_session_transition_log.deleteMany();
  await prismaClient.live_session_break_time.deleteMany();
  await prismaClient.live_session_allow.deleteMany();
  await prismaClient.video_session_break_time.deleteMany();
  await prismaClient.video_session_allow.deleteMany();
  await prismaClient.live_session.deleteMany();
  await prismaClient.video_session.deleteMany();
  await prismaClient.follow.deleteMany();
  await prismaClient.oauth_client.deleteMany();
  await prismaClient.pfp.deleteMany();
  await prismaClient.email_verification.deleteMany();
  await prismaClient.user.deleteMany();
  await prismaClient.category.deleteMany();
  await prismaClient.preferred_category.deleteMany();

  const finalCounts = await getTableCounts();

  let deletedRows = false;

  for (const table in initialCounts) {
    const deleted = initialCounts[table] - finalCounts[table];
    if (deleted > 0) {
      console.error(
        `WARNING ⚠️ ${deleted} rows were deleted from ${table}. This might indicate a leak in test cases.`
      );

      deletedRows = true;
    }
  }

  if (!deletedRows) {
    console.log('Database cleanup completed 🧹 No existing data was found.');
  }
};

// 각 테이블의 row 수를 가져오는 헬퍼 함수
const getTableCounts = async () => {
  const counts: Record<string, number> = {};

  counts.live_session_transition_log =
    await prismaClient.live_session_transition_log.count();
  counts.live_session_break_time =
    await prismaClient.live_session_break_time.count();
  counts.live_session_allow = await prismaClient.live_session_allow.count();
  counts.video_session_break_time =
    await prismaClient.video_session_break_time.count();
  counts.video_session_allow = await prismaClient.video_session_allow.count();
  counts.live_session = await prismaClient.live_session.count();
  counts.video_session = await prismaClient.video_session.count();
  counts.follow = await prismaClient.follow.count();
  counts.oauth_client = await prismaClient.oauth_client.count();
  counts.pfp = await prismaClient.pfp.count();
  counts.email_verification = await prismaClient.email_verification.count();
  counts.user = await prismaClient.user.count();
  counts.category = await prismaClient.category.count();
  counts.preferred_category = await prismaClient.preferred_category.count();

  return counts;
};

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

export default tearDown;
