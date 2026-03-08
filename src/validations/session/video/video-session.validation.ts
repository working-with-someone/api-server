import joi from 'joi';
import type { RequestSchema } from '../../../middleware/validate.middleware';
import { access_level } from '@prisma/client';
import { pagiNationQuerySchema } from '../../pagination.validation';

export const getVideoSession: RequestSchema = {
  params: joi.object().keys({
    video_session_id: joi.string().required(),
  }),
};

export const getVideoSessions: RequestSchema = {
  // pagination query schema를 extend
  query: pagiNationQuerySchema.keys({
    category: joi.string().optional(),
    search: joi.string().optional(),
  }),
};

export const createVideoSession: RequestSchema = {
  body: joi.object().keys({
    //required
    video_id: joi.string().required(),
    access_level: joi
      .number()
      .valid(
        access_level.PUBLIC,
        access_level.FOLLOWER_ONLY,
        access_level.PRIVATE
      )
      .required(),

    //optional
    title: joi.string().optional(),
    description: joi.string().optional(),
    category_label: joi.string().optional(),
    thumbnail: joi.optional(),
  }),
  file: joi.object().optional(),
};

export const updateVideoSessionStatus: RequestSchema = {
  body: joi.object().keys({
    status: joi.number().required(),
  }),
};

export const updateVideoSessionThumbnail: RequestSchema = {
  params: joi.object().keys({
    video_session_id: joi.string().required(),
  }),
  file: joi.object().required(),
};

export const updateVideoSession: RequestSchema = {
  params: joi.object().keys({
    video_session_id: joi.string().required(),
  }),
  body: joi.object().keys({
    title: joi.string().optional(),
    description: joi.string().optional(),
    access_level: joi
      .number()
      .valid(
        access_level.PUBLIC,
        access_level.FOLLOWER_ONLY,
        access_level.PRIVATE
      )
      .optional(),
    category_label: joi.string().optional(),
    thumbnail: joi.optional(),
  }),
  file: joi.object().optional(),
};
