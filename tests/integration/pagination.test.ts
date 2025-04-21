import { access_level, live_session_status } from '@prisma/client';
jest.unmock('../../src/database/clients/prisma.ts');
import currUser from '../data/curr-user';
import request from 'supertest';
import server from '../../src';
import httpStatusCode from 'http-status-codes';

import {
  createTestLiveSession,
  sampleBreakTimeFields,
} from '../data/live-session';

describe('Pagination', () => {
  beforeAll(async () => {
    await currUser.insert();
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('Live Session', () => {
    beforeAll(async () => {
      for (let i = 0; i < 100; i++) {
        await createTestLiveSession({
          access_level: access_level.PUBLIC,
          organizer_id: currUser.id,
          status: live_session_status.OPENED,
          break_time: sampleBreakTimeFields,
        });
      }
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
