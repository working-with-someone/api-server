import validate, {
  RequestSchema,
} from '../../../src/middleware/validate.middleware';
import joi from 'joi';
import { createRequest, createResponse } from 'node-mocks-http';
import { mockDeep } from 'jest-mock-extended';
import { PrismaClient } from '@prisma/client';

jest.mock('../../../src/database/clients/prisma', () => ({
  __esModule: true,
  default: mockDeep<PrismaClient>(),
}));

// must mocking next function which accpet err argument but do nothing
const mockNext = jest.fn((err) => err);

describe('validate middleware', () => {
  test('Should_Call_Without_Error_About_Valid_Request', async () => {
    const validationSchema: RequestSchema = {
      query: joi.object({
        page: joi.number().optional(),
        per_page: joi.number().optional(),
      }),
    };

    const req = createRequest({
      params: {},
      query: {
        page: '1',
        per_page: '10',
      },
      body: {},
    });

    const res = createResponse();

    const validateMiddleware = validate(validationSchema);

    validateMiddleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    // must be called without error
    expect(mockNext.mock.calls[0][0]).toBeUndefined();
  });

  test('Should_Call_With_Error_About_Invalid_Request(invalid type)', async () => {
    const validationSchema: RequestSchema = {
      query: joi.object({
        page: joi.number().required(),
        per_page: joi.number().required(),
      }),
    };

    const req = createRequest({
      params: {},
      query: {
        page: 'not a number',
        per_page: 'not a number',
      },
      body: {},
    });

    const res = createResponse();

    const validateMiddleware = validate(validationSchema);

    validateMiddleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  test('Should_Call_With_Error_About_Invalid_Request(missing required field)', async () => {
    const validationSchema: RequestSchema = {
      query: joi.object({
        page: joi.number().required(),
        per_page: joi.number().required(),
      }),
    };

    const req = createRequest({
      params: {},
      query: {
        page: '1',
      },
      body: {},
    });

    const res = createResponse();

    const validateMiddleware = validate(validationSchema);

    validateMiddleware(req, res, mockNext);

    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext.mock.calls[0][0]).toBeInstanceOf(Error);
  });
  test('Should_Attach_Default_Values_To_Request', async () => {
    const validationSchema: RequestSchema = {
      query: joi.object({
        page: joi.number().optional().default(1),
        per_page: joi.number().optional().default(1),
      }),
    };

    const req = createRequest({});

    const res = createResponse();

    const validateMiddleware = validate(validationSchema);

    validateMiddleware(req, res, mockNext);

    expect(req.query.page).toBe(1);
    expect(req.query.per_page).toBe(1);
    expect(mockNext).toHaveBeenCalledTimes(1);
    expect(mockNext.mock.calls[0][0]).toBeUndefined();
  });
});
