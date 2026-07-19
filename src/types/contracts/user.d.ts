import type { Prisma } from '../../../prisma/generated/prisma/client';

export type PublicUser = Prisma.userGetPayload<{
  include: {
    pfp: true;
  };
  omit: {
    encrypted_password: true;
  };
}>;

