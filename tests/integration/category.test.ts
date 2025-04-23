import request from 'supertest';
import server from '../../src';

describe('Category API', () => {
  afterAll((done) => {
    server.close(done);
  });

  describe('GET /categories', () => {
    test('Response_200_With_Single_Following', async () => {
      const res = await request(server).get(`/categories`);

      expect(res.statusCode).toEqual(200);
    });
  });
});
