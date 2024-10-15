import joi from 'joi';

export default {
  getUser: {
    params: joi.object().keys({
      userId: joi.number().required(),
    }),
  },
  // user update 데이터에 username, pfp는 모두 optional이다.
  updateUser: {
    params: joi.object().keys({
      userId: joi.number().required(),
    }),
    body: joi.object().keys({
      username: joi.string().optional(),
      pfpToDefault: joi.boolean().optional(),
    }),
    files: joi.object().optional().keys({
      pfp: joi.object(),
    }),
  },
};
