import joi from 'joi';
import type { RequestSchema } from '../../../middleware/validate.middleware';
import { live_session_status, access_level } from '@prisma/client';
import { pagiNationQuerySchema } from '../../pagination.validation';

export const getLiveSession: RequestSchema = {
  params: joi.object().keys({
    live_session_id: joi.string().required(),
  }),
};

export const getLiveSessions: RequestSchema = {
  // pagination query schema를 extend
  query: pagiNationQuerySchema.keys({
    category: joi.string().optional(),
  }),
};

export const createLiveSession: RequestSchema = {
  body: joi.object().keys({
    title: joi.string().required(),
    description: joi.string().required(),
    access_level: joi
      .number()
      .valid(
        access_level.PUBLIC,
        access_level.FOLLOWER_ONLY,
        access_level.PRIVATE
      )
      .required(),
    category: joi.string().required(),
    thumbnail: joi.optional(),
  }),
  file: joi.object().optional(),
};

export const updateLiveSessionStatus: RequestSchema = {
  body: joi.object().keys({
    status: joi
      .number()
      .valid(
        live_session_status.OPENED,
        live_session_status.BREAKED,
        live_session_status.CLOSED
      )
      .required(),
  }),
};
