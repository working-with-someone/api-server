import { RequestSchema } from "../../../../middleware/validate.middleware";
import joi from "joi";
import { pagiNationQuerySchema } from "../../../pagination.validation";

export const getUserVideoSessions: RequestSchema = {
    query: pagiNationQuerySchema,
    params: joi.object().keys({
        user_id: joi.number().required(),
    }),
};

export const getUserVideoSession: RequestSchema = {
    params: joi.object().keys({
        user_id: joi.number().required(),
        video_session_id: joi.string().required(),
    }),
};
