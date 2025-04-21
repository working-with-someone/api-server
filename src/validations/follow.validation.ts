import joi from 'joi';
import { RequestSchema } from '../middleware/validate.middleware';
import { pagiNationQuerySchema } from './pagination.validation';

export const getFollowings: RequestSchema = {
  query: pagiNationQuerySchema,
  params: joi.object().keys({
    user_id: joi.number(),
  }),
};

export const createFollowing: RequestSchema = {
  params: joi.object().keys({
    user_id: joi.number(),
    following_user_id: joi.number(),
  }),
};

export const checkFollowing: RequestSchema = {
  params: joi.object().keys({
    user_id: joi.number(),
    following_user_id: joi.number(),
  }),
};

export const deleteFollowing: RequestSchema = {
  params: joi.object().keys({
    user_id: joi.number(),
    following_user_id: joi.number(),
  }),
};

export const getFollowers: RequestSchema = {
  query: pagiNationQuerySchema,
  params: joi.object().keys({
    user_id: joi.number(),
  }),
};
