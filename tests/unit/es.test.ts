import es from '../../src/lib/search';
import { videoSessionFactory } from '../factories';
import categoryFactory from '../factories/category-factory';
import { PublicVideoSession } from '../../src/types/contracts/video-session';
import { category as PublicCategory } from '../../prisma/generated/prisma/client';
import esClient from '../../src/lib/search/client';
import currUser from '../data/curr-user';
import { resolveIndex } from '../../src/lib/search/indices';
import e from 'express';

const TEST_INDEX = 'video_sessions_test';
const CATEGORY_TEST_INDEX = 'categories_test';

describe('Environment Variables', () => {
  beforeAll(async () => {
    await currUser.insert();
  });

  test('Environment_Variables_Must_Declared', async () => {
    expect(process.env.ES_SERVER_URL).toBeDefined();
    expect(process.env.ES_USERNAME).toBeDefined();
    expect(process.env.ES_PASSWORD).toBeDefined();
  });
});

describe('Index Resolution', () => {
  test('production', () => {
    process.env.NODE_ENV = 'production';

    expect(resolveIndex('video_session')).toEqual('video_sessions');
    expect(resolveIndex('live_session')).toEqual('live_sessions');
    expect(resolveIndex('category')).toEqual('categories');
  });

  test('development', () => {
    process.env.NODE_ENV = 'development';

    expect(resolveIndex('video_session')).toEqual('video_sessions_dev');
    expect(resolveIndex('live_session')).toEqual('live_sessions_dev');
    expect(resolveIndex('category')).toEqual('categories_dev');
  });

  test('test', () => {
    process.env.NODE_ENV = 'test';

    expect(resolveIndex('video_session')).toEqual('video_sessions_test');
    expect(resolveIndex('live_session')).toEqual('live_sessions_test');
    expect(resolveIndex('category')).toEqual('categories_test');
  });
});

describe('Elasticsearch Document Operations', () => {
  describe('Video Session Document', () => {
    let videoSession: PublicVideoSession;

    beforeAll(async () => {
      videoSession = await videoSessionFactory.createAndSave();
    });

    afterAll(async () => {
      await es.video_session.deleteMany();
      await videoSessionFactory.cleanup();
    });

    describe('Get Document', () => {
      beforeEach(async () => {
        await es.video_session.create(videoSession);
      });

      afterEach(async () => {
        await es.video_session.deleteMany();
      });

      test('find', async () => {
        const retrievedDocument = await es.video_session.find(videoSession.id);

        expect(retrievedDocument).toBeDefined();
        expect(retrievedDocument!.id).toEqual(videoSession.id);
      });

      test('find_NonExistingDocument', async () => {
        await expect(
          es.video_session.find('none-existing-id')
        ).rejects.toThrow();
      });

      test('findMany', async () => {
        const videoSessions = await videoSessionFactory.createManyAndSave({
          count: 5,
        });

        await es.video_session.createMany(videoSessions);

        const retrievedDocuments = await es.video_session.findMany(
          videoSessions.map((doc) => doc.id)
        );

        expect(retrievedDocuments).toHaveLength(5);

        await videoSessionFactory.deleteMany({
          id: {
            in: videoSessions.map((doc) => doc.id),
          },
        });
      });
    });

    describe('Create Document', () => {
      afterEach(async () => {
        await es.video_session.deleteMany();
      });

      test('create', async () => {
        await es.video_session.create(videoSession);

        const document = await es.video_session.find(videoSession.id);

        expect(document).toBeDefined();
        expect(document!.id).toEqual(videoSession.id);
        expect(document!.organizer.id).toEqual(videoSession.organizer.id);
      });

      test('create_ExistingDocument_Must_Reject', async () => {
        await es.video_session.create(videoSession);

        await expect(es.video_session.create(videoSession)).rejects.toThrow();
      });

      test('createMany', async () => {
        const videoSessions = await videoSessionFactory.createManyAndSave({
          count: 5,
        });

        const documents = await es.video_session.createMany(videoSessions);

        expect(documents).toHaveLength(5);
        expect(documents.map((doc) => doc.id)).toEqual(
          videoSessions.map((doc) => doc.id)
        );

        await videoSessionFactory.deleteMany({
          id: {
            in: videoSessions.map((doc) => doc.id),
          },
        });
      });

      test('createMany_ExistingDocuments_Must_Reject', async () => {
        const videoSessions = await videoSessionFactory.createManyAndSave({
          count: 5,
        });

        await es.video_session.createMany(videoSessions);

        await expect(
          es.video_session.createMany(videoSessions)
        ).rejects.toThrow();

        await videoSessionFactory.deleteMany({
          id: {
            in: videoSessions.map((doc) => doc.id),
          },
        });
      });
    });

    describe('Search Document', () => {
      beforeEach(async () => {
        await es.video_session.create(videoSession);
      });

      afterEach(async () => {
        await es.video_session.deleteMany();
      });

      test('searchDocument', async () => {
        const searchResult = await es.video_session.search({
          query: {
            match: {
              title: videoSession.title,
            },
          },
          from: 0,
          size: 10,
        });

        expect(searchResult).toHaveLength(1);
        expect(searchResult[0].id).toEqual(videoSession.id);
      });
    });

    describe('Update Document', () => {
      beforeEach(async () => {
        await es.video_session.create(videoSession);
      });

      afterEach(async () => {
        await es.video_session.deleteMany();
        await videoSessionFactory.cleanup();
      });

      test('updateDocument', async () => {
        const updatedTitle = 'Updated Title';

        const updatedDocument = await es.video_session.update({
          ...videoSession,
          title: updatedTitle,
        });

        expect(updatedDocument).toBeDefined();
        expect(updatedDocument!.title).toEqual(updatedTitle);
      });

      test('updateDocument_NonExistingDocument_Must_Reject', async () => {
        const nonExistingDocument = await videoSessionFactory.createAndSave();

        await expect(
          es.video_session.update(nonExistingDocument)
        ).rejects.toThrowError(
          `Document with id ${nonExistingDocument.id} does not exist in index ${TEST_INDEX}`
        );
      });
    });

    describe('Delete Document', () => {
      beforeEach(async () => {
        await es.video_session.create(videoSession);
      });

      afterEach(async () => {
        await es.video_session.deleteMany();
      });

      test('deleteDocument', async () => {
        await es.video_session.delete(videoSession.id);

        expect(
          await esClient.exists({
            index: TEST_INDEX,
            id: videoSession.id,
          })
        ).toBe(false);
      });

      test('deleteDocument_NonExistingDocument_Must_Resolve_Without_Error', async () => {
        const nonExistingDocument = await videoSessionFactory.createAndSave();

        await expect(
          es.video_session.delete(nonExistingDocument.id)
        ).resolves.not.toThrow();
      });

      test('deleteMany', async () => {
        const createdVideoSessions =
          await videoSessionFactory.createManyAndSave({
            count: 5,
          });

        await es.video_session.createMany(createdVideoSessions);

        const beforeDeleteCount = await es.video_session.findMany(
          createdVideoSessions.map((videoSession) => videoSession.id)
        );

        await es.video_session.deleteMany(
          createdVideoSessions.map((doc) => doc.id)
        );

        const afterDeleteCount = await es.video_session.findMany(
          createdVideoSessions.map((videoSession) => videoSession.id)
        );

        expect(beforeDeleteCount.length).toEqual(5);
        expect(afterDeleteCount.length).toEqual(0);
      });

      test('deleteMany_NonExistingDocuments_Must_Resolve_Without_Error', async () => {
        const nonExistingIds = ['non-existing-id-1', 'non-existing-id-2'];

        await expect(
          es.video_session.deleteMany(nonExistingIds)
        ).resolves.not.toThrow();
      });
    });
  });

  describe('Category Document', () => {
    let category: PublicCategory;

    beforeAll(async () => {
      category = await categoryFactory.createAndSave();
    });

    afterAll(async () => {
      await es.category.deleteMany();
      await categoryFactory.cleanup();
    });

    describe('Get Document', () => {
      beforeEach(async () => {
        await es.category.create(category);
      });

      afterEach(async () => {
        await es.category.deleteMany();
      });

      test('find', async () => {
        const retrievedDocument = await es.category.find(category.label);

        expect(retrievedDocument).toBeDefined();
        expect(retrievedDocument!.label).toEqual(category.label);
      });

      test('find_NonExistingDocument', async () => {
        await expect(es.category.find('none-existing-label')).rejects.toThrow();
      });

      test('findMany', async () => {
        const categories = await categoryFactory.createManyAndSave({
          count: 5,
        });

        await es.category.createMany(categories);

        const retrievedDocuments = await es.category.findMany(
          categories.map((doc) => doc.label)
        );

        expect(retrievedDocuments).toHaveLength(5);

        await categoryFactory.deleteMany({
          label: { in: categories.map((doc) => doc.label) },
        });
      });
    });

    describe('Create Document', () => {
      afterEach(async () => {
        await es.category.deleteMany();
      });

      test('create', async () => {
        await es.category.create(category);

        const document = await es.category.find(category.label);

        expect(document).toBeDefined();
        expect(document!.label).toEqual(category.label);
      });

      test('create_ExistingDocument_Must_Reject', async () => {
        await es.category.create(category);

        await expect(es.category.create(category)).rejects.toThrow();
      });

      test('createMany', async () => {
        const categories = await categoryFactory.createManyAndSave({
          count: 5,
        });

        const documents = await es.category.createMany(categories);

        expect(documents).toHaveLength(5);
        expect(documents.map((doc) => doc.label)).toEqual(
          expect.arrayContaining(categories.map((doc) => doc.label))
        );

        await categoryFactory.deleteMany({
          label: { in: categories.map((doc) => doc.label) },
        });
      });
    });

    describe('Search Document', () => {
      beforeEach(async () => {
        await es.category.create(category);
      });

      afterEach(async () => {
        await es.category.deleteMany();
      });

      test('searchDocument', async () => {
        const searchResult = await es.category.search({
          query: {
            match: {
              label: category.label,
            },
          },
          from: 0,
          size: 10,
        });

        expect(searchResult).toHaveLength(1);
        expect(searchResult[0].label).toEqual(category.label);
      });
    });

    describe('Update Document', () => {
      beforeEach(async () => {
        await es.category.create(category);
      });

      afterEach(async () => {
        await es.category.deleteMany();
      });

      test('updateDocument', async () => {
        const updatedDocument = await es.category.update(category);

        expect(updatedDocument).toBeDefined();
        expect(updatedDocument!.label).toEqual(category.label);
      });

      test('updateDocument_NonExistingDocument_Must_Reject', async () => {
        const nonExistingDocument = await categoryFactory.createAndSave();

        await expect(
          es.category.update(nonExistingDocument)
        ).rejects.toThrowError(
          `Document with id ${nonExistingDocument.label} does not exist in index ${CATEGORY_TEST_INDEX}`
        );
      });
    });

    describe('Delete Document', () => {
      beforeEach(async () => {
        await es.category.create(category);
      });

      afterEach(async () => {
        await es.category.deleteMany();
      });

      test('deleteDocument', async () => {
        await es.category.delete(category.label);

        expect(
          await esClient.exists({
            index: CATEGORY_TEST_INDEX,
            id: category.label,
          })
        ).toBe(false);
      });

      test('deleteDocument_NonExistingDocument_Must_Resolve_Without_Error', async () => {
        const nonExistingDocument = await categoryFactory.createAndSave();

        await expect(
          es.category.delete(nonExistingDocument.label)
        ).resolves.not.toThrow();
      });

      test('deleteMany', async () => {
        const createdCategories = await categoryFactory.createManyAndSave({
          count: 5,
        });

        await es.category.createMany(createdCategories);

        const beforeDeleteCount = await es.category.findMany(
          createdCategories.map((category) => category.label)
        );

        await es.category.deleteMany(createdCategories.map((doc) => doc.label));

        const afterDeleteCount = await es.category.findMany(
          createdCategories.map((category) => category.label)
        );

        expect(beforeDeleteCount.length).toEqual(5);
        expect(afterDeleteCount.length).toEqual(0);
      });

      test('deleteMany_NonExistingDocuments_Must_Resolve_Without_Error', async () => {
        const nonExistingLabels = [
          'non-existing-label-1',
          'non-existing-label-2',
        ];

        await expect(
          es.category.deleteMany(nonExistingLabels)
        ).resolves.not.toThrow();
      });
    });
  });
});
