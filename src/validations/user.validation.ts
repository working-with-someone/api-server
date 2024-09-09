import joi from 'joi';

export default {
  getUser: {
    params: joi.object().keys({
      userId: joi.number().required(),
    }),
  },
  updateSelf: {
    body: joi.object().keys({
      username: joi.string().optional(),
    }),
  },
};
