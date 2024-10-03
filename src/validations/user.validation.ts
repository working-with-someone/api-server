import joi from 'joi';

export default {
  getUser: {
    params: joi.object().keys({
      userId: joi.number().required(),
    }),
  },
  // user update 데이터에 username, pfp는 모두 optional이다.
  updateSelf: {
    body: joi.object().keys({
      username: joi.string().optional(),
    }),
    files: joi.object().optional().keys({
      pfp: joi.object(),
    }),
  },
};
