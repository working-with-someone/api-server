export interface followInfo {
  following_user_id: number;
  follower_user_id: number;
}

export type createFollow = followInfo;

export type deleteFollow = followInfo;
