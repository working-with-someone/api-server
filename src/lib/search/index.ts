import { PublicLiveSession } from '../../types/contracts/live-session';
import { PublicVideoSession } from '../../types/contracts/video-session';
import esClient from '../../database/searchService/client';
import type { Client } from '@elastic/elasticsearch';
import { buildPagenationMeta } from '../../utils/pagination';
import { PaginatedResult } from '../../types/pagination';

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

// do not call referesh after every operation
class SearchService {
  esClient: Client;
  constructor() {
    this.esClient = esClient;
  }

  async getDocument<T extends Indexes>(index: T, id: string) {
    const isExist = await this.esClient.exists({
      index: resolveIndex(index),
      id,
    });

    if (!isExist) {
      throw new Error(
        `Document with id ${id} does not exist in index ${resolveIndex(index)}`
      );
    }

    const res = await this.esClient.get<DocumentTypeMap[T]>({
      index: resolveIndex(index),
      id,
    });

    return res._source;
  }

  async createDocument<T extends Indexes>(
    index: T,
    document: DocumentTypeMap[T]
  ) {
    const isExist = await this.esClient.exists({
      index: resolveIndex(index),
      id: document.id,
    });

    if (isExist) {
      throw new Error(
        `Document with id ${document.id} already exists in index ${resolveIndex(index)}`
      );
    }

    const res = await this.esClient.index({
      index: resolveIndex(index),
      id: document.id,
      document,
    });

    if (res.result !== 'created') {
      throw new Error(
        `Failed to create document in index ${resolveIndex(index)} with id ${document.id}`
      );
    }

    return this.getDocument(index, document.id);
  }

  async updateDocument<T extends Indexes>(
    index: T,
    document: DocumentTypeMap[T]
  ) {
    const isExist = await this.esClient.exists({
      index: resolveIndex(index),
      id: document.id,
    });

    if (!isExist) {
      throw new Error(
        `Document with id ${document.id} does not exist in index ${resolveIndex(index)}`
      );
    }

    const res = await this.esClient.update({
      index: resolveIndex(index),
      id: document.id,
      doc: document,
    });

    if (res.result !== 'updated') {
      throw new Error(
        `Failed to update document in index ${resolveIndex(index)} with id ${document.id}`
      );
    }

    return this.getDocument(index, document.id);
  }

  async deleteDocument(index: Indexes, id: string) {
    const isExist = await this.esClient.exists({
      index: resolveIndex(index),
      id,
    });

    if (!isExist) {
      throw new Error(
        `Document with id ${id} does not exist in index ${resolveIndex(index)}`
      );
    }

    return await this.esClient.delete({
      index: resolveIndex(index),
      id,
    });
  }

  async deleteAllDocuments(index: Indexes) {
    await this.esClient.deleteByQuery({
      index: resolveIndex(index),
      query: {
        match_all: {},
      },
    });
  }

  async searchDocument<T extends Indexes>(
    index: T,
    s: string,
    page: number,
    per_page: number
  ): Promise<PaginatedResult<DocumentTypeMap[T][], 'data'>> {
    if (!Number.isInteger(page) || page < 1) {
      throw new Error('page must be an integer greater than 0');
    }

    if (!Number.isInteger(per_page) || per_page < 1) {
      throw new Error('per_page must be an integer greater than 0');
    }

    const result = await this.esClient.search<DocumentTypeMap[T]>({
      index: resolveIndex(index),
      from: (page - 1) * per_page,
      size: per_page + 1,
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

    const data = result.hits.hits
      .map((hit) => hit._source)
      .filter(
        (document): document is DocumentTypeMap[T] =>
          typeof document !== 'undefined'
      );

    const pagination = buildPagenationMeta(data, page, per_page);

    if (pagination.hasMore) {
      data.pop();
    }

    return {
      data,
      pagination,
    };
  }
}

const searchService = new SearchService();

export default searchService;
