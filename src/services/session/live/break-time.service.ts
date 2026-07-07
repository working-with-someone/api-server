import { CreateBreakTimeInput } from './break-time';
import prismaClient from '../../../database/clients/prisma';
import { PublicBreakTime } from '../../../types/contracts/break-time';

export async function createBreakTime(
  data: CreateBreakTimeInput
): Promise<PublicBreakTime> {
  const liveSession = data.liveSession;

  const breakTime = await prismaClient.live_session_break_time.create({
    data: {
      interval: data.interval,
      duration: data.duration,
      live_session: {
        connect: {
          id: liveSession.id,
        },
      },
    },
  });

  return breakTime;
}

const breakTimeService = {
  createBreakTime,
};

export default breakTimeService;
