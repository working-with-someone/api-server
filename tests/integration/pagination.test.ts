import request from 'supertest';
import server from '../../src';
import httpStatusCode from 'http-status-codes';

import prismaClient from '../../src/database/clients/prisma';
import { liveSessionFactory } from '../factories';
import currUser from '../data/curr-user';

describe('Pagination', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('Live Session', () => {
    beforeAll(async () => {
      await liveSessionFactory.createManyAndSave({
        count: 100,
        overrides: {
          organizer: { connect: { id: currUser.id } },
        },
      });
    });

    afterAll(async () => {
      await prismaClient.live_session.deleteMany();
    });

    test('Response_400_With_When_Page_Is_Zero', async () => {
      const res = await request(server).get(`/sessions/live`).query({
        page: 0,
        per_page: 10,
      });

      expect(res.status).toEqual(httpStatusCode.BAD_REQUEST);
    });

    test('Response_First_Page_With_Correct_Pagination_Meta_Data', async () => {
      const res = await request(server).get(`/sessions/live`).query({
        page: 1,
        per_page: 10,
      });

      expect(res.status).toBe(httpStatusCode.OK);
      expect(res.body.pagination).toMatchObject({
        currentPage: 1,
        totalPages: 10,
        totalItems: 100,
        per_page: 10,
        hasMore: true,
        previousPage: null,
        nextPage: 2,
      });
    });

    test('Response_Middle_Page_With_Correct_Pagination_Meta_Data', async () => {
      const res = await request(server).get(`/sessions/live`).query({
        page: 5,
        per_page: 10,
      });

      expect(res.status).toBe(httpStatusCode.OK);
      expect(res.body.pagination).toMatchObject({
        currentPage: 5,
        totalPages: 10,
        totalItems: 100,
        per_page: 10,
        hasMore: true,
        previousPage: 4,
        nextPage: 6,
      });
    });

    test('Response_Last_Page_With_Correct_Pagination_Meta_Data', async () => {
      const res = await request(server).get(`/sessions/live`).query({
        page: 10,
        per_page: 10,
      });

      expect(res.status).toBe(httpStatusCode.OK);
      expect(res.body.pagination).toMatchObject({
        currentPage: 10,
        totalPages: 10,
        totalItems: 100,
        per_page: 10,
        hasMore: false,
        previousPage: 9,
        nextPage: null,
      });
    });

    test('Response_Empty_Page_When_Page_Exceeds_Total_Pages', async () => {
      const res = await request(server).get(`/sessions/live`).query({
        page: 20,
        per_page: 10,
      });

      expect(res.status).toBe(httpStatusCode.OK);
      expect(res.body.pagination).toMatchObject({
        currentPage: 20,
        totalPages: 10,
        totalItems: 100,
        per_page: 10,
        hasMore: false,
        previousPage: 19,
        nextPage: null,
      });
    });
  });
});
