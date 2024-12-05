import prismaClient from '../../../src/database/clients/prisma';
import testUserData from '../../data/user.json';

export default function globalSetup() {
  prismaClient.user.create({
    data: { ...testUserData.currUser, pfp: {} },
  });
}
