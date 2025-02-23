import { Prisma } from '@prisma/client';
import testUserData from './user.json';
import { GetResult } from '@prisma/client/runtime';
import prismaClient from '../../src/database/clients/prisma';

type CurrentUser = Prisma.userGetPayload<{
  include: {
    pfp: true;
    email_verification: true;
  };
}>;

class CurrUser implements CurrentUser {
  pfp: Prisma.pfpGetPayload<null>;
  email_verification: Prisma.email_verificationGetPayload<null>;
  id: number;
  username: string;
  encrypted_password: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  followers_count: number;
  followings_count: number;

  constructor() {
    this.id = 0;
    this.username = 'currUser';
    this.encrypted_password =
      '$2b$10$6ZbxBKRk1qdhySGQeN5Iw.CTA4XFCVGL9KHkZnabitdjSRegvBif2';
    this.email = 'email@test.com';
    this.pfp = {
      curr: '/media/images/default/pfp',
      is_default: true,
      user_id: 0,
    };
    this.email_verification = {
      email_verified: true,
      verify_token: 'testVerifyToken',
      created_at: new Date(),
      expired_at: new Date(),
      user_id: 0,
    };
    this.created_at = new Date();
    this.updated_at = new Date();

    this.followers_count = 0;
    this.followings_count = 0;
  }

  async store() {
    await prismaClient.user.create({
      data: {
        ...this,
      },
    });
  }
}
