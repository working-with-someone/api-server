import { PublicLiveSession } from '../../types/contracts/live-session';
import { PublicVideoSession } from '../../types/contracts/video-session';
import esClient from '../../database/searchService/client';
import type { Client } from '@elastic/elasticsearch';

type Indexes = 'video_session' | 'live_session';

const _Indexes = {
  production: {
    video_session: 'video_sessions',
    live_session: 'live_sessions',
  },
  development: {
    video_session: 'video_sessions_dev',
    live_session: 'live_sessions_dev',
  },
  test: {
    video_session: 'video_sessions_test',
    live_session: 'live_sessions_test',
  },
};

type DocumentTypeMap = {
  video_session: PublicVideoSession;
  live_session: PublicLiveSession;
};

function resolveIndex(index: Indexes) {
  switch (process.env.NODE_ENV) {
    case 'production':
      return _Indexes.production[index];
    case 'development':
      return _Indexes.development[index];
    case 'test':
      return _Indexes.test[index];
    default:
      throw new Error('Unknown NODE_ENV');
  }
}

class SearchService {
  esClient: Client;
  constructor() {
    this.esClient = esClient;
  }

  async getDocument(index: Indexes, id: string) {
    return await esClient.get({
      index: resolveIndex(index),
      id,
    });
  }

  async createDocument<T extends Indexes>(
    index: T,
    document: DocumentTypeMap[T]
  ) {
    return await esClient.index({
      index: resolveIndex(index),
      id: document.id,
      document,
    });
  }

  async updateDocument<T extends Indexes>(
    index: T,
    document: DocumentTypeMap[T]
  ) {
    return await esClient.update({
      index: resolveIndex(index),
      id: document.id,
      doc: document,
    });
  }

  async deleteDocument(index: Indexes, id: string) {
    return await esClient.delete({
      index: resolveIndex(index),
      id,
    });
  }

  async deleteAllDocuments(index: Indexes) {
    return await esClient.deleteByQuery({
      index: resolveIndex(index),
      query: {
        match_all: {},
      },
    });
  }

  async searchDocument(index: Indexes, s: any) {
    return await esClient.search({
      index: resolveIndex(index),
      query: s.trim()
        ? {
            bool: {
              should: [
                {
                  match: {
                    title: {
                      query: s,
                      boost: 10,
                    },
                  },
                },
                {
                  match: {
                    description: {
                      query: s,
                      boost: 1,
                    },
                  },
                },
                {
                  match: {
                    'organizer.username': {
                      query: s,
                      boost: 2,
                    },
                  },
                },
              ],
            },
          }
        : { match_all: {} },
    });
  }
}

const searchService = new SearchService();

export default searchService;
