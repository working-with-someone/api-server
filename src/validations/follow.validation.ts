import joi from 'joi';
import { RequestSchema } from '../middleware/validate';
import { pageNationQuerySchema } from './pagenation.validation';

export const getFollowings: RequestSchema = {
  query: pageNationQuerySchema,
  params: joi.object().keys({
    userId: joi.number(),
  }),
};

export const createFollowing: RequestSchema = {
  params: joi.object().keys({
    userId: joi.number(),
    following_user_id: joi.number(),
  }),
};

export const checkFollowing: RequestSchema = {
  params: joi.object().keys({
    userId: joi.number(),
    following_user_id: joi.number(),
  }),
};

export const deleteFollowing: RequestSchema = {
  params: joi.object().keys({
    userId: joi.number(),
    following_user_id: joi.number(),
  }),
};

export const getFollowers: RequestSchema = {
  query: pageNationQuerySchema,
  params: joi.object().keys({
    userId: joi.number(),
  }),
};
