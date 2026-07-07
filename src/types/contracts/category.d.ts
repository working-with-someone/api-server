import type { Prisma } from '@prisma/client';

export type PublicCategory = Prisma.categoryGetPayload<false>;

export type PublicPreferredCategory =
  Prisma.preferred_categoryGetPayload<false>;
