import joi from 'joi';
import { RequestSchema } from '../middleware/validate';

export const getFollowings: RequestSchema = {
  params: joi.object().keys({
    userId: joi.number(),
  }),
};

export const createFollow: RequestSchema = {
  params: joi.object().keys({
    userId: joi.number(),
    following_user_id: joi.number(),
  }),
};

export const deleteFollow: RequestSchema = {
  params: joi.object().keys({
    userId: joi.number(),
    following_user_id: joi.number(),
  }),
};

export const getFollowers: RequestSchema = {
  params: joi.object().keys({
    userId: joi.number(),
  }),
};
