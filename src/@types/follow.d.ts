import type { PageNationData } from './pagenation';

export interface GetFollowersInput extends PageNationData {
  userId: number;
}

export interface GetFollowingsInput extends PageNationData {
  userId: number;
}

export interface FollowInfo {
  following_user_id: number;
  follower_user_id: number;
}

export type GetFollowingInput = FollowInfo;

export type CreateFollowingInput = FollowInfo;

export type CheckFollowingInput = FollowInfo;

export type DeleteFollowInput = FollowInfo;
