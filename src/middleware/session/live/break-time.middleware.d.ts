import type { Prisma } from '@prisma/client';

export type AttachedBreakTime =
  Prisma.live_session_break_timeGetPayload<true> | null;
