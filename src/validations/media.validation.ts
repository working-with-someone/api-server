import joi from 'joi';

export default {
  getImage: {
    params: joi.object().keys({
      key: joi.string().required(),
    }),
  },
};
