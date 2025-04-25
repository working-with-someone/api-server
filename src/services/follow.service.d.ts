import type { PagiNationData } from '../types/pagination';

export interface GetFollowersInput extends PagiNationData {
  userId: number;
}

export interface GetFollowingsInput extends PagiNationData {
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
