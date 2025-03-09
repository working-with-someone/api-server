import { AttachedLiveSession } from '.';

export interface CreateBreakTimeInput {
  liveSession: AttachedLiveSession;
  interval: number;
  duration: number;
}
