import type { PageNationData } from './pagenation';

export interface GetFollowers extends PageNationData {
  userId: number;
}

export interface GetFollowings extends PageNationData {
  userId: number;
}

export interface FollowInfo {
  following_user_id: number;
  follower_user_id: number;
}

export type GetFollowing = FollowInfo;

export type CreateFollow = FollowInfo;

export type CheckFollowing = FollowInfo;

export type DeleteFollow = FollowInfo;
