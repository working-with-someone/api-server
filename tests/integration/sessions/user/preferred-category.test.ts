import request from 'supertest';
import server from '../../../../src';
import httpStatusCode from 'http-status-codes';
import prismaClient from '../../../../src/database/clients/prisma';
import currUser from '../../../data/curr-user';
import categoryFactory from '../../../factories/category-factory';
import { userFactory } from '../../../factories';
import preferredCategoryFactory from '../../../factories/preferred-category-factory';

describe('Preferred Category API', () => {
  let otherUser: any;

  beforeAll(async () => {
    otherUser = await userFactory.createAndSave();
  });

  afterAll((done) => {
    server.close(done);
  });

  afterAll(async () => {
    await prismaClient.preferred_category.deleteMany({});
    await categoryFactory.cleanup();
    await preferredCategoryFactory.cleanup();
  });

  describe('GET /users/:user_id/preferred-categories', () => {
    beforeEach(async () => {
      let categoryA = await categoryFactory.createAndSave();
      let categoryB = await categoryFactory.createAndSave();

      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryA.label,
      });

      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryB.label,
      });
    });

    afterEach(async () => {
      await categoryFactory.cleanup();
    });

    test('Response_200_With_Preferred_Categories', async () => {
      const res = await request(server).get(
        `/users/${currUser.id}/preferred-categories`
      );

      expect(res.statusCode).toEqual(httpStatusCode.OK);
      expect(res.body.data).toHaveLength(2);
    });
  });

  describe('POST /users/:user_id/preferred-categories/:category_label', () => {
    let categoryA: any;
    let categoryB: any;
    let categoryC: any;

    beforeEach(async () => {
      categoryA = await categoryFactory.createAndSave();
      categoryB = await categoryFactory.createAndSave();
      categoryC = await categoryFactory.createAndSave();
    });

    afterEach(async () => {
      await categoryFactory.cleanup();
    });

    test('Response_201_With_Create_Preferred_Category', async () => {
      const res = await request(server).post(
        `/users/${currUser.id}/preferred-categories/${categoryA.label}`
      );

      expect(res.statusCode).toEqual(httpStatusCode.CREATED);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.user_id).toEqual(currUser.id);
      expect(res.body.data.category_label).toEqual(categoryA.label);
      expect(res.body.data.priority).toEqual(0);
    });

    test('Response_201_With_Incremented_Priority', async () => {
      const res1 = await request(server).post(
        `/users/${currUser.id}/preferred-categories/${categoryA.label}`
      );

      expect(res1.body.data.priority).toEqual(0);

      const res2 = await request(server).post(
        `/users/${currUser.id}/preferred-categories/${categoryB.label}`
      );

      expect(res2.body.data.priority).toEqual(1);

      const res3 = await request(server).post(
        `/users/${currUser.id}/preferred-categories/${categoryC.label}`
      );

      expect(res3.body.data.priority).toEqual(2);
    });

    test('Response_409', async () => {
      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryA.label,
      });

      const res = await request(server).post(
        `/users/${currUser.id}/preferred-categories/${categoryA.label}`
      );

      expect(res.statusCode).toEqual(httpStatusCode.CONFLICT);
    });

    test('Response_400_When_Exceeded_Limit', async () => {
      // Create 20 preferred categories for the user
      for (let i = 0; i < 20; i++) {
        const category = await categoryFactory.createAndSave();

        await preferredCategoryFactory.createAndSave({
          user_id: currUser.id,
          category_label: category.label,
        });
      }

      const res = await request(server).post(
        `/users/${currUser.id}/preferred-categories/${categoryA.label}`
      );

      expect(res.statusCode).toEqual(httpStatusCode.BAD_REQUEST);
    });

    test('Response_404_When_Category_Not_Found', async () => {
      const res = await request(server).post(
        `/users/${currUser.id}/preferred-categories/non_existent_category`
      );

      expect(res.statusCode).toEqual(httpStatusCode.NOT_FOUND);
    });

    test('Response_403_About_Forbidden', async () => {
      const res = await request(server).post(
        `/users/${otherUser.id}/preferred-categories/${categoryA.label}`
      );

      expect(res.statusCode).toEqual(httpStatusCode.FORBIDDEN);
    });
  });

  describe('PUT /users/:user_id/preferred-categories/:category_label/priority/:priority', () => {
    let categoryA: any;
    let categoryB: any;
    let categoryC: any;

    beforeEach(async () => {
      categoryA = await categoryFactory.createAndSave();
      categoryB = await categoryFactory.createAndSave();
      categoryC = await categoryFactory.createAndSave();
    });

    afterEach(async () => {
      await categoryFactory.cleanup();
    });

    test('Response_200_With_Updated_Priority_When_Moving_Category_To_Top', async () => {
      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryA.label,
      });

      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryB.label,
      });
      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryC.label,
      });

      const res = await request(server).put(
        `/users/${currUser.id}/preferred-categories/${categoryC.label}/priority/0`
      );

      expect(res.statusCode).toEqual(httpStatusCode.OK);

      const resAfterUpdate = await request(server).get(
        `/users/${currUser.id}/preferred-categories`
      );

      expect(resAfterUpdate.body.data[0].category_label).toEqual(
        categoryC.label
      );
      expect(resAfterUpdate.body.data[0].priority).toEqual(0);
      expect(resAfterUpdate.body.data[1].category_label).toEqual(
        categoryA.label
      );
      expect(resAfterUpdate.body.data[1].priority).toEqual(1);
      expect(resAfterUpdate.body.data[2].category_label).toEqual(
        categoryB.label
      );
      expect(resAfterUpdate.body.data[2].priority).toEqual(2);
    });

    test('Response_200_With_Updated_Priority_When_Moving_Category_To_Bottom', async () => {
      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryA.label,
      });
      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryB.label,
      });
      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryC.label,
      });

      const res = await request(server).put(
        `/users/${currUser.id}/preferred-categories/${categoryA.label}/priority/2`
      );
      expect(res.statusCode).toEqual(httpStatusCode.OK);

      const resAfterUpdate = await request(server).get(
        `/users/${currUser.id}/preferred-categories`
      );
      expect(resAfterUpdate.body.data[0].category_label).toEqual(
        categoryB.label
      );
      expect(resAfterUpdate.body.data[0].priority).toEqual(0);

      expect(resAfterUpdate.body.data[1].category_label).toEqual(
        categoryC.label
      );
      expect(resAfterUpdate.body.data[1].priority).toEqual(1);

      expect(resAfterUpdate.body.data[2].category_label).toEqual(
        categoryA.label
      );
      expect(resAfterUpdate.body.data[2].priority).toEqual(2);
    });

    test('Response_200_With_Same_Priority', async () => {
      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryA.label,
      });
      const res = await request(server).put(
        `/users/${currUser.id}/preferred-categories/${categoryA.label}/priority/0`
      );
      expect(res.statusCode).toEqual(httpStatusCode.OK);
      const resAfterUpdate = await request(server).get(
        `/users/${currUser.id}/preferred-categories`
      );
      expect(resAfterUpdate.body.data[0].category_label).toEqual(
        categoryA.label
      );
      expect(resAfterUpdate.body.data[0].priority).toEqual(0);
    });

    test('Response_400_When_Priority_Exceeds_Count', async () => {
      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryA.label,
      });

      const res = await request(server).put(
        `/users/${currUser.id}/preferred-categories/${categoryA.label}/priority/1`
      );

      expect(res.statusCode).toEqual(httpStatusCode.BAD_REQUEST);
    });

    test('Response_404_When_Preferred_Category_Not_Found', async () => {
      const res = await request(server).put(
        `/users/${currUser.id}/preferred-categories/non_existent_category/priority/0`
      );

      expect(res.statusCode).toEqual(httpStatusCode.NOT_FOUND);
    });

    test('Response_403_About_Forbidden', async () => {
      const res = await request(server).put(
        `/users/${otherUser.id}/preferred-categories/${categoryA.label}/priority/0`
      );

      expect(res.statusCode).toEqual(httpStatusCode.FORBIDDEN);
    });
  });

  describe('DELETE /users/:user_id/preferred-categories/:category_label', () => {
    let categoryA: any;

    beforeEach(async () => {
      categoryA = await categoryFactory.createAndSave();

      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryA.label,
      });
    });

    afterEach(async () => {
      await categoryFactory.cleanup();
    });

    test('Response_204_Delete_Preferred_Category', async () => {
      const res = await request(server).delete(
        `/users/${currUser.id}/preferred-categories/${categoryA.label}`
      );

      expect(res.statusCode).toEqual(httpStatusCode.NO_CONTENT);
    });

    test('Response_200_With_Reordered_Priorities', async () => {
      await prismaClient.preferred_category.delete({
        where: {
          user_id_category_label: {
            user_id: currUser.id,
            category_label: categoryA.label,
          },
        },
      });

      let categoryB = await categoryFactory.createAndSave();
      let categoryC = await categoryFactory.createAndSave();
      let categoryD = await categoryFactory.createAndSave();

      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryB.label,
      });

      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryC.label,
      });

      await preferredCategoryFactory.createAndSave({
        user_id: currUser.id,
        category_label: categoryD.label,
      });

      const res = await request(server).delete(
        `/users/${currUser.id}/preferred-categories/${categoryB.label}`
      );

      expect(res.statusCode).toEqual(httpStatusCode.NO_CONTENT);

      const resAfterDelete = await request(server).get(
        `/users/${currUser.id}/preferred-categories`
      );

      expect(resAfterDelete.body.data[0].category_label).toEqual(
        categoryC.label
      );
      expect(resAfterDelete.body.data[0].priority).toEqual(0);
      expect(resAfterDelete.body.data[1].category_label).toEqual(
        categoryD.label
      );
      expect(resAfterDelete.body.data[1].priority).toEqual(1);
    });

    test('Response_404_When_Preferred_Category_Not_Found', async () => {
      const res = await request(server).delete(
        `/users/${currUser.id}/preferred-categories/non_existent_category`
      );

      expect(res.statusCode).toEqual(httpStatusCode.NOT_FOUND);
    });

    test('Response_403_About_Forbidden', async () => {
      const res = await request(server).delete(
        `/users/${otherUser.id}/preferred-categories/${categoryA.label}`
      );

      expect(res.statusCode).toEqual(httpStatusCode.FORBIDDEN);
    });
  });
});
