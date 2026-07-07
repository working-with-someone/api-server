import { PublicLiveSession } from '../../../types/contracts/live-session';

export interface CreateBreakTimeInput {
  liveSession: PublicLiveSession;
  interval: number;
  duration: number;
}
