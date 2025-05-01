/* eslint-disable no-console */

import { category, PrismaClient, user } from '@prisma/client';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';
import { generateStreamKey } from '../src/utils/generator';

const prisma = new PrismaClient();

const USERS_COUNT = 20;
const FOLLOWS_COUNT = 30;
const LIVE_SESSIONS_COUNT = 10;
const VIDEO_SESSIONS_COUNT = 15;

// some keywords for '?? with me'
const categorieLabels = [
  'study',
  'code',
  'work',
  'game',
  'listen',
  'watch',
  'get beauty',
  'running',
  'eat',
];

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
};

const generateRandomId = (): string => {
  return crypto.randomUUID();
};

async function main(): Promise<void> {
  console.log('Starting seed data generation 🌱');

  if (
    process.env.MY_USER_NAME &&
    process.env.MY_USER_EMAIL &&
    process.env.MY_USER_PASSWORD
  ) {
    console.log('Creating my user...');

    const myUsername = process.env.MY_USER_NAME;
    const myUserEmail = process.env.MY_USER_EMAIL;
    const myUserPassword = process.env.MY_USER_PASSWORD;

    const myUser = await prisma.user.create({
      data: {
        username: myUsername,
        email: myUserEmail,
        encrypted_password: await hashPassword(myUserPassword),
        pfp: {
          create: {
            curr: '/media/images/default/pfp',
            is_default: true,
          },
        },
        email_verification: {
          create: {
            email_verified: true,
            verify_token: await hashPassword('myUserVerifyToken'),
            expired_at: faker.date.future(),
          },
        },
      },
    });

    console.log('✅  My user created');
  }

  const users: user[] = [];

  console.log('Creating users...');

  for (let i = 0; i < USERS_COUNT; i++) {
    const username = faker.internet.username();
    const email = faker.internet.email();
    const encrypted_password = await hashPassword('password123');
    const verifyToken = await hashPassword('verifyToken123');

    const user = await prisma.user.create({
      data: {
        username,
        email,
        encrypted_password,
        pfp: {
          create: {
            curr: '/media/images/default/pfp',
            is_default: true,
          },
        },
        email_verification: {
          create: {
            email_verified: faker.datatype.boolean(),
            verify_token: verifyToken,
            expired_at: faker.date.future(),
          },
        },
      },
    });

    users.push(user);
    console.log(`✅  User created: ${user.username}`);
  }

  // Create follow relationships
  console.log('Creating follow relationships...');
  const followPairs = new Set<string>();

  for (let i = 0; i < FOLLOWS_COUNT; i++) {
    const followerIndex = Math.floor(Math.random() * USERS_COUNT);
    let followingIndex = Math.floor(Math.random() * USERS_COUNT);

    // Prevent self-following
    while (followerIndex === followingIndex) {
      followingIndex = Math.floor(Math.random() * USERS_COUNT);
    }

    const pairKey = `${followerIndex}-${followingIndex}`;

    // Prevent duplicate follows
    if (followPairs.has(pairKey)) {
      i--;
      continue;
    }

    followPairs.add(pairKey);

    try {
      await prisma.$transaction([
        prisma.follow.create({
          data: {
            follower_user_id: users[followerIndex].id,
            following_user_id: users[followingIndex].id,
          },
        }),
        // Update followers_count and followings_count
        prisma.user.update({
          where: { id: users[followingIndex].id },
          data: { followers_count: { increment: 1 } },
        }),

        prisma.user.update({
          where: { id: users[followerIndex].id },
          data: { followings_count: { increment: 1 } },
        }),
      ]);
    } catch (error) {
      console.error('Error creating follow relationship:', error);
      i--;
    }
  }

  // Create categories
  // Create live sessions

  const categories: category[] = [];

  for (const categoryLabel of categorieLabels) {
    const category = await prisma.category.create({
      data: {
        label: categoryLabel,
      },
    });
    categories.push(category);
    console.log(`✅  Category created: ${category.label}`);
  }

  console.log('Creating live sessions...');
  const liveSessionStatuses = ['READY', 'OPENED', 'BREAKED', 'CLOSED'];
  const accessLevels = ['PUBLIC', 'FOLLOWER_ONLY', 'PRIVATE'];

  for (const category of categories) {
    for (let i = 0; i < LIVE_SESSIONS_COUNT; i++) {
      const userIndex = Math.floor(Math.random() * USERS_COUNT);
      const sessionId = generateRandomId();
      const status = liveSessionStatuses[
        Math.floor(Math.random() * liveSessionStatuses.length)
      ] as 'READY' | 'OPENED' | 'BREAKED' | 'CLOSED';
      const accessLevel = accessLevels[
        Math.floor(Math.random() * accessLevels.length)
      ] as 'PUBLIC' | 'FOLLOWER_ONLY' | 'PRIVATE';

      const liveSession = await prisma.live_session.create({
        data: {
          id: sessionId,
          title: faker.lorem.sentence().substring(0, 100),
          description: faker.lorem.paragraphs(2),
          thumbnail_uri: faker.image.url(),
          category: {
            connect: {
              label: category.label,
            },
          },
          status: status,
          stream_key: generateStreamKey(),
          access_level: accessLevel,
          started_at: status !== 'READY' ? faker.date.recent() : null,
          organizer: {
            connect: {
              id: users[userIndex].id,
            },
          },
        },
      });

      console.log(
        `✅  Live Session Created : ${liveSession.title} / ${liveSession.status} / ${liveSession.category_label}`
      );

      // Create allow list for private sessions
      if (accessLevel === 'PRIVATE') {
        const allowCount = Math.floor(Math.random() * 5) + 1;
        const allowedUserIndices = new Set<number>();

        for (let j = 0; j < allowCount; j++) {
          let allowedUserIndex = Math.floor(Math.random() * USERS_COUNT);

          // Prevent duplicates and self-allowing
          while (
            allowedUserIndex === userIndex ||
            allowedUserIndices.has(allowedUserIndex)
          ) {
            allowedUserIndex = Math.floor(Math.random() * USERS_COUNT);
          }

          allowedUserIndices.add(allowedUserIndex);

          await prisma.live_session_allow.create({
            data: {
              live_session_id: sessionId,
              user_id: users[allowedUserIndex].id,
            },
          });
        }

        console.log(`   ✅  allow list created`);
      }

      // Set break time for some sessions
      if (i % 3 === 0) {
        await prisma.live_session_break_time.create({
          data: {
            session_id: sessionId,
            interval: (Math.floor(Math.random() * 5) + 1) * 10, // in 10-minute units
            duration: (Math.floor(Math.random() * 3) + 1) * 5, // in 5-minute units
          },
        });

        console.log(`   ✅  live Session break time created`);
      }

      // Create status transition logs
      if (status !== 'READY') {
        // READY -> OPENED
        await prisma.live_session_transition_log.create({
          data: {
            live_session_id: sessionId,
            from_state: 'READY',
            to_state: 'OPENED',
            transitioned_at: faker.date.recent(),
          },
        });

        console.log(`   ✅  live Session transition log created`);

        if (status === 'BREAKED' || status === 'CLOSED') {
          // OPENED -> BREAKED or OPENED -> CLOSED
          await prisma.live_session_transition_log.create({
            data: {
              live_session_id: sessionId,
              from_state: 'OPENED',
              to_state: status,
              transitioned_at: faker.date.recent(),
            },
          });
        }
      }
    }
  }

  // Create video sessions
  // console.log('Creating video sessions...');

  // for (const category of categories) {
  //   for (let i = 0; i < VIDEO_SESSIONS_COUNT; i++) {
  //     const userIndex = Math.floor(Math.random() * USERS_COUNT);
  //     const sessionId = generateRandomId();
  //     const accessLevel = Math.floor(Math.random() * 3) + 1; // 1: public, 2: followersOnly, 3: private

  //     const videoSession = await prisma.video_session.create({
  //       data: {
  //         id: sessionId,
  //         title: faker.lorem.sentence().substring(0, 100),
  //         description: faker.lorem.paragraphs(2),
  //         thumbnail_uri: faker.image.url(),
  //         category: {
  //           connect: {
  //             label: category.label,
  //           },
  //         },
  //         duration: BigInt(Math.floor(Math.random() * 3600) + 600), // between 10 minutes and 1 hour
  //         access_level: accessLevel,
  //         organizer: {
  //           connect: {
  //             id: users[userIndex].id,
  //           },
  //         },
  //       },
  //     });

  //     // Create allow list for private sessions
  //     if (accessLevel === 3) {
  //       const allowCount = Math.floor(Math.random() * 5) + 1;
  //       const allowedUserIndices = new Set<number>();

  //       for (let j = 0; j < allowCount; j++) {
  //         let allowedUserIndex = Math.floor(Math.random() * USERS_COUNT);

  //         // Prevent duplicates and self-allowing
  //         while (
  //           allowedUserIndex === userIndex ||
  //           allowedUserIndices.has(allowedUserIndex)
  //         ) {
  //           allowedUserIndex = Math.floor(Math.random() * USERS_COUNT);
  //         }

  //         allowedUserIndices.add(allowedUserIndex);

  //         await prisma.video_session_allow.create({
  //           data: {
  //             video_session_id: sessionId,
  //             user_id: users[allowedUserIndex].id,
  //           },
  //         });
  //       }
  //     }

  //     // Set break time for some sessions
  //     if (i % 3 === 0) {
  //       await prisma.video_session_break_time.create({
  //         data: {
  //           session_id: sessionId,
  //           interval: (Math.floor(Math.random() * 5) + 1) * 10, // in 10-minute units
  //           duration: (Math.floor(Math.random() * 3) + 1) * 5, // in 5-minute units
  //         },
  //       });
  //     }
  //   }
  // }

  console.log('Seed data generation completed 🌱');
}

main()
  .catch((e) => {
    console.error('Error during seed data generation:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
