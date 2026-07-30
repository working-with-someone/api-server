import { PublicVideoSession } from '../../contracts/video-session';
import { PublicVideoSessionComment } from '../../contracts/comment';
import { PublicBreakTime } from '../../contracts/break-time';
import { PublicLiveSession } from '../../contracts/live-session';
import { PublicFollowing } from '../../contracts/follow';
import {
  PublicVideoSessionCommentLike,
  PublicVideoSessionLike,
} from '../../contracts/like';
import { PublicUser } from '../../contracts/user';

export {};

declare global {
  namespace Express {
    interface Request {
      user: PublicUser;
      params: Record<string, string>;
    }

    interface Locals {
      liveSession: PublicLiveSession;
      videoSession: PublicVideoSession;
      videoSessionComment: PublicVideoSessionComment;
      breakTime: PublicBreakTime;
      user: PublicUser;
      following: PublicFollowing;
      like: PublicVideoSessionLike;
      video_session_comment_like: PublicVideoSessionCommentLike;
    }

    interface ParamsDictionary {
      user_id: string;
      video_session_id: string;
      video_session_comment_id: string;
      break_time_id: string;
    }
  }
}
