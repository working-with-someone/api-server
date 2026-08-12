import searchService from '../../src/lib/search';
import { videoSessionFactory } from '../factories';
import { PublicVideoSession } from '../../src/types/contracts/video-session';
import esClient from '../../src/database/searchService/client';
import currUser from '../data/curr-user';

const TEST_INDEX = 'video_sessions_test';

async function createTestDocument(document: PublicVideoSession) {
  await esClient.index({
    index: TEST_INDEX,
    id: document.id,
    document,
  });

  await esClient.indices.refresh({ index: TEST_INDEX });
}

async function cleanupTestDocuments() {
  await esClient
    .deleteByQuery({
      index: TEST_INDEX,
      query: { match_all: {} },
    })
    .catch(() => undefined);

  await esClient.indices.refresh({ index: TEST_INDEX });
}

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

describe('Elasticsearch Document Operations', () => {
  let videoSession: PublicVideoSession;

  beforeAll(async () => {
    videoSession = await videoSessionFactory.createAndSave();
  });

  afterAll(async () => {
    cleanupTestDocuments();
    await videoSessionFactory.cleanup();
  });

  describe('Video Session Document', () => {
    describe('Get Document', () => {
      beforeEach(async () => {
        await createTestDocument(videoSession);
      });

      afterEach(async () => {
        await cleanupTestDocuments();
      });

      test('getDocument', async () => {
        const retrievedDocument = await searchService.getDocument(
          'video_session',
          videoSession.id
        );

        expect(retrievedDocument).toBeDefined();
        expect(retrievedDocument!.id).toEqual(videoSession.id);
      });

      test('getDocument_NonExistingDocument', async () => {
        const nonExistingDocument = await videoSessionFactory.createAndSave();

        await expect(
          searchService.getDocument('video_session', nonExistingDocument.id)
        ).rejects.toThrowError(
          `Document with id ${nonExistingDocument.id} does not exist in index ${TEST_INDEX}`
        );
      });
    });

    describe('Create Document', () => {
      afterEach(async () => {
        cleanupTestDocuments();
      });

      test('createDocument', async () => {
        const document = await searchService.createDocument(
          'video_session',
          videoSession
        );

        expect(document).toBeDefined();
        expect(document!.id).toEqual(videoSession.id);
      });

      test('createDocument_ExistingDocument', async () => {
        await createTestDocument(videoSession);

        await expect(
          searchService.createDocument('video_session', videoSession)
        ).rejects.toThrowError(
          `Document with id ${videoSession.id} already exists in index ${TEST_INDEX}`
        );
      });
    });

    describe('Search Document', () => {
      beforeEach(async () => {
        await createTestDocument(videoSession);
      });

      afterEach(async () => {
        cleanupTestDocuments();
      });

      test('searchDocument', async () => {
        const searchResult = await searchService.searchDocument(
          'video_session',
          videoSession.title,
          1,
          10
        );

        expect(searchResult.data).toHaveLength(1);
        expect(searchResult.data[0].id).toEqual(videoSession.id);
        expect(searchResult.pagination).toMatchObject({
          currPage: 1,
          per_page: 10,
          hasMore: false,
          prevPage: null,
          nextPage: null,
        });
      });
    });

    describe('Update Document', () => {
      beforeEach(async () => {
        await createTestDocument(videoSession);
      });

      afterEach(async () => {
        cleanupTestDocuments();
        await videoSessionFactory.cleanup();
      });

      test('updateDocument', async () => {
        const updatedTitle = 'Updated Title';

        const updatedDocument = await searchService.updateDocument(
          'video_session',
          {
            ...videoSession,
            title: updatedTitle,
          }
        );

        expect(updatedDocument).toBeDefined();
        expect(updatedDocument!.title).toEqual(updatedTitle);
      });

      test('updateDocument_NonExistingDocument', async () => {
        const nonExistingDocument = await videoSessionFactory.createAndSave();

        await expect(
          searchService.updateDocument('video_session', nonExistingDocument)
        ).rejects.toThrowError(
          `Document with id ${nonExistingDocument.id} does not exist in index ${TEST_INDEX}`
        );
      });
    });

    describe('Update Document - Non Existing', () => {
      afterEach(async () => {
        cleanupTestDocuments();
      });

      test('updateDocument_NonExistingDocument', async () => {
        const nonExistingDocument = await videoSessionFactory.createAndSave();

        await expect(
          searchService.updateDocument('video_session', nonExistingDocument)
        ).rejects.toThrowError(
          `Document with id ${nonExistingDocument.id} does not exist in index ${TEST_INDEX}`
        );
      });
    });

    describe('Delete Document', () => {
      beforeEach(async () => {
        await createTestDocument(videoSession);
      });

      afterEach(async () => {
        cleanupTestDocuments();
      });

      test('deleteDocument', async () => {
        await searchService.deleteDocument('video_session', videoSession.id);

        expect(
          await esClient.exists({
            index: TEST_INDEX,
            id: videoSession.id,
          })
        ).toBe(false);
      });

      test('deleteDocument_NonExistingDocument', async () => {
        const nonExistingDocument = await videoSessionFactory.createAndSave();

        await expect(
          searchService.deleteDocument('video_session', nonExistingDocument.id)
        ).rejects.toThrowError(
          `Document with id ${nonExistingDocument.id} does not exist in index ${TEST_INDEX}`
        );
      });
    });
  });
});
