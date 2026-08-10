import searchService from '../../src/lib/search';
import { videoSessionFactory } from '../factories';
import { PublicVideoSession } from '../../src/types/contracts/video-session';
import esClient from '../../src/database/searchService/client';
import currUser from '../data/curr-user';
import { SearchTotalHits } from '@elastic/elasticsearch/lib/api/types';

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
    await videoSessionFactory.cleanup();
  });

  describe('Video Session Document', () => {
    test('getDocument', async () => {
      const document = await esClient.create({
        index: 'video_sessions_test',
        id: videoSession.id,
        document: videoSession,
      });

      const retrievedDocument = await searchService.getDocument(
        'video_session',
        document._id
      );

      expect(retrievedDocument).toBeDefined();
      expect((retrievedDocument._source as any).id).toEqual(videoSession.id);

      await esClient.delete({
        index: 'video_sessions_test',
        id: document._id,
      });

      expect(
        await esClient.exists({
          index: 'video_sessions_test',
          id: document._id,
        })
      ).toBe(false);
    });

    test('createDocument', async () => {
      const document = await searchService.createDocument(
        'video_session',
        videoSession
      );

      expect(document).toBeDefined();

      await esClient.delete({
        index: 'video_sessions_test',
        id: document._id,
      });

      expect(
        await esClient.exists({
          index: 'video_sessions_test',
          id: document._id,
        })
      ).toBe(false);
    });

    test('searchDocument', async () => {
      const document = await esClient.create({
        index: 'video_sessions_test',
        id: videoSession.id,
        document: videoSession,
      });

      await esClient.indices.refresh({ index: 'video_sessions_test' });

      const searchResult = await searchService.searchDocument(
        'video_session',
        videoSession.title
      );

      expect((searchResult.hits.total as SearchTotalHits).value).toBe(1);
      expect((searchResult.hits.hits[0]._source as any).id).toEqual(
        videoSession.id
      );

      await esClient.delete({
        index: 'video_sessions_test',
        id: document._id,
      });

      expect(
        await esClient.exists({
          index: 'video_sessions_test',
          id: document._id,
        })
      ).toBe(false);
    });

    test('updateDocument', async () => {
      const document = await esClient.create({
        index: 'video_sessions_test',
        id: videoSession.id,
        document: videoSession,
      });

      const updatedTitle = 'Updated Title';

      await searchService.updateDocument('video_session', {
        ...videoSession,
        title: updatedTitle,
      });

      await esClient.indices.refresh({ index: 'video_sessions_test' });
      const updatedDocument = await esClient.get({
        index: 'video_sessions_test',
        id: document._id,
      });

      expect((updatedDocument._source as any).title).toEqual(updatedTitle);

      await esClient.delete({
        index: 'video_sessions_test',
        id: document._id,
      });

      expect(
        await esClient.exists({
          index: 'video_sessions_test',
          id: document._id,
        })
      ).toBe(false);
    });

    test('deleteDocument', async () => {
      const document = await esClient.create({
        index: 'video_sessions_test',
        id: videoSession.id,
        document: videoSession,
      });

      await searchService.deleteDocument('video_session', document._id);

      expect(
        await esClient.exists({
          index: 'video_sessions_test',
          id: document._id,
        })
      ).toBe(false);
    });
  });
});
