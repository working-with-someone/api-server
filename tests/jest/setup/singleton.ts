import { PrismaClient } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import prismaClient from '../../../src/database/clients/prisma';

jest.mock('../../../src/database/clients/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

export const prismaClientMock =
  prismaClient as unknown as DeepMockProxy<PrismaClient>;
