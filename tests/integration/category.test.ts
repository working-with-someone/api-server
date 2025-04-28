import request from 'supertest';
import server from '../../src';
import httpStatusCode from 'http-status-codes';
import categoryFactory from '../factories/category-factory';
import { liveSessionFactory } from '../factories';

describe('Category API', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('GET /categories', () => {
    beforeAll(async () => {
      const categories = await categoryFactory.createManyAndSave({
        count: 100,
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

      // 내림차순으로 정렬되어있어야한다.
      for (let i = 1; i < per_page; i++) {
        expect(res.body.data[i]._count.live_session).toBeLessThanOrEqual(
          res.body.data[i - 1]._count.live_session
        );
      }
    });
  });
});
