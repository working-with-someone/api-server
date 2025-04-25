import { Prisma } from '@prisma/client';
import { AttachedLiveSession } from '../../../middleware/session/live/live-session';

// break time이 존재하지 않을 수 있다. 이 때, not found가 아닌 204로 처리한다.
export type AttachedBreakTime =
  Prisma.live_session_break_timeGetPayload<true> | null;

export interface CreateBreakTimeInput {
  liveSession: AttachedLiveSession;
  interval: number;
  duration: number;
}
