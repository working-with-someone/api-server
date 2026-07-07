import { userVideoSessionService } from '../../../../services';
import asyncCatch from '../../../../utils/asyncCatch';
import { Request, Response } from 'express';

export const getUserVideoSessions = asyncCatch(
  async (req: Request, res: Response) => {
    const { videoSessions, pagination } =
      await userVideoSessionService.getUserVideoSessions({
        userId: parseInt(req.params.user_id),
        currUserId: req.session.userId as number,
        page: parseInt(req.query.page as string),
        per_page: parseInt(req.query.per_page as string),
      });

    return res.status(200).json({
      data: videoSessions,
      pagination,
    });
  }
);

export const getUserVideoSession = asyncCatch(
  async (req: Request, res: Response) => {
    const videoSession = await userVideoSessionService.getUserVideoSession({
      userId: parseInt(req.params.user_id),
      videoSessionId: req.params.video_session_id,
      currUserId: req.session.userId as number,
    });

    return res.status(200).json({
      data: videoSession,
    });
  }
);
