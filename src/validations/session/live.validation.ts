import joi from 'joi';
import type { RequestSchema } from '../../middleware/validate';
import categories from '../../../static/data/category.json';
import { accessLevel, liveSessionStatus } from '../../enums/session';

export const getLiveSession: RequestSchema = {
  params: joi.object().keys({
    live_session_id: joi.string().required(),
  }),
};

export const createLiveSession: RequestSchema = {
  body: joi.object().keys({
    title: joi.string().required(),
    description: joi.string().required(),
    access_level: joi
      .number()
      .valid(accessLevel.public, accessLevel.followersOnly, accessLevel.private)
      .required(),
    category: joi
      .string()
      .allow(...categories.map((category) => category.label))
      .required(),
    thumbnail: joi.optional(),
  }),
  file: joi.object().optional(),
};

export const updateLiveSessionStatus: RequestSchema = {
  body: joi.object().keys({
    status: joi
      .number()
      .valid(
        liveSessionStatus.opened,
        liveSessionStatus.breaked,
        liveSessionStatus.closed
      )
      .required(),
  }),
};
