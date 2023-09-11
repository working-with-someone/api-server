import Joi from 'joi';

export default {
  getUser: {
    params: Joi.object().keys({
      userId: Joi.required(),
    }),
  },
};
