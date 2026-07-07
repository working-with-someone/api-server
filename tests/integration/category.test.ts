import request from 'supertest';
import server from '../../src';
import httpStatusCode from 'http-status-codes';
import categoryFactory from '../factories/category-factory';
import { liveSessionFactory } from '../factories';
import currUser from '../data/curr-user';

describe('Category API', () => {
  beforeAll(async () => {
    await currUser.insert();
  });

  afterAll(async () => {
    await currUser.delete();
  });

  afterAll((done) => {
    server.close(done);
  });

  describe('GET /categories', () => {
    beforeAll(async () => {
      const categories = await categoryFactory.createManyAndSave({
        count: 20,
      });

      for (const category of categories) {
        const randomInt = Math.floor(Math.random() * 20) + 1;

        await liveSessionFactory.createManyAndSave({
          count: randomInt,
          overrides: {
            category: {
              connect: {
                label: category.label,
              },
            },
          },
        });
      }
    });

    afterAll(async () => {
      await liveSessionFactory.cleanup();
      await categoryFactory.cleanup();
    });

    // category를 요청시, 200 status code를 응답받아야한다.
    test('Response_200', async () => {
      const res = await request(server).get(`/categories`);

      expect(res.statusCode).toEqual(200);
    });

    describe('Sort', () => {
      // live session_count를 sort key로 live session요청 시 live session count가 내림차순으로 정렬된 category을 200 status code와 함께 응답받아야한다.
      test('Response_200_Sorted_By_Live_Session_Count_Categories', async () => {
        const per_page = 10;
        const res = await request(server).get('/categories').query({
          page: 1,
          per_page,
          sort: 'live_session_count',
        });

        expect(res.statusCode).toEqual(httpStatusCode.OK);
        expect(res.body.data).toHaveLength(10);
        expect(res.body.pagination).toMatchObject({
          currPage: 1,
          per_page,
          hasMore: true,
          prevPage: null,
          nextPage: 2,
        });
      });

      test('Response_200_Sorted_By_Video_Session_Count_Categories', async () => {
        const per_page = 10;
        const res = await request(server).get('/categories').query({
          page: 1,
          per_page,
          sort: 'video_session_count',
        });
        expect(res.statusCode).toEqual(httpStatusCode.OK);
        expect(res.body.data).toHaveLength(10);
        expect(res.body.pagination).toMatchObject({
          currPage: 1,
          per_page,
          hasMore: true,
          prevPage: null,
          nextPage: 2,
        });
      });

      test('Response_400_When_Sort_Value_Is_Invalid', async () => {
        const res = await request(server).get('/categories').query({
          page: 1,
          per_page: 10,
          sort: 'oldest',
        });

        expect(res.statusCode).toEqual(httpStatusCode.BAD_REQUEST);
      });

      test('Response_400_When_Sort_Value_Is_Empty_String', async () => {
        const res = await request(server).get('/categories').query({
          page: 1,
          per_page: 10,
          sort: '',
        });

        expect(res.statusCode).toEqual(httpStatusCode.BAD_REQUEST);
      });
    });

    describe('Pagination', () => {
      test('Response_400_When_Page_Is_Zero', async () => {
        const res = await request(server).get('/categories').query({
          page: 0,
          per_page: 10,
        });

        expect(res.statusCode).toEqual(httpStatusCode.BAD_REQUEST);
      });

      test('Response_First_Page_With_Correct_Pagination_Meta_Data', async () => {
        const per_page = 7;
        const res = await request(server).get('/categories').query({
          page: 1,
          per_page,
        });

        expect(res.statusCode).toEqual(httpStatusCode.OK);
        expect(res.body.data).toHaveLength(7);
        expect(res.body.pagination).toMatchObject({
          currPage: 1,
          per_page,
          hasMore: true,
          prevPage: null,
          nextPage: 2,
        });
      });

      test('Response_Middle_Page_With_Correct_Pagination_Meta_Data', async () => {
        const per_page = 7;
        const res = await request(server).get('/categories').query({
          page: 2,
          per_page,
        });

        expect(res.statusCode).toEqual(httpStatusCode.OK);
        expect(res.body.data).toHaveLength(7);
        expect(res.body.pagination).toMatchObject({
          currPage: 2,
          per_page,
          hasMore: true,
          prevPage: 1,
          nextPage: 3,
        });
      });

      test('Response_Last_Page_With_Correct_Pagination_Meta_Data', async () => {
        const per_page = 7;
        const res = await request(server).get('/categories').query({
          page: 3,
          per_page,
        });

        expect(res.statusCode).toEqual(httpStatusCode.OK);
        expect(res.body.data).toHaveLength(6);
        expect(res.body.pagination).toMatchObject({
          currPage: 3,
          per_page,
          hasMore: false,
          prevPage: 2,
          nextPage: null,
        });
      });

      test('Response_Empty_Page_When_Page_Exceeds_Total_Pages', async () => {
        const per_page = 7;
        const res = await request(server).get('/categories').query({
          page: 4,
          per_page,
        });

        expect(res.statusCode).toEqual(httpStatusCode.OK);
        expect(res.body.data).toHaveLength(0);
        expect(res.body.pagination).toMatchObject({
          currPage: 4,
          per_page,
          hasMore: false,
          prevPage: 3,
          nextPage: null,
        });
      });
    });
  });
});
