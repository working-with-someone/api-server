import es from '../../src/lib/search';
import { videoSessionFactory } from '../factories';
import { PublicVideoSession } from '../../src/types/contracts/video-session';
import esClient from '../../src/lib/search/client';
import currUser from '../data/curr-user';
import { resolveIndex } from '../../src/lib/search/indices';
import e from 'express';

const TEST_INDEX = 'video_sessions_test';

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
  });

  test('development', () => {
    process.env.NODE_ENV = 'development';

    expect(resolveIndex('video_session')).toEqual('video_sessions_dev');
    expect(resolveIndex('live_session')).toEqual('live_sessions_dev');
  });

  test('test', () => {
    process.env.NODE_ENV = 'test';

    expect(resolveIndex('video_session')).toEqual('video_sessions_test');
    expect(resolveIndex('live_session')).toEqual('live_sessions_test');
  });
});

describe('Elasticsearch Document Operations', () => {
  let videoSession: PublicVideoSession;

  beforeAll(async () => {
    videoSession = await videoSessionFactory.createAndSave();
  });

  afterAll(async () => {
    await es.video_session.deleteMany();
    await videoSessionFactory.cleanup();
  });

  describe('Video Session Document', () => {
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
});
