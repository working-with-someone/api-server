import type { Client } from '@elastic/elasticsearch';
import {
  BulkRequest,
  DeleteByQueryRequest,
  MappingTypeMapping,
  SearchRequest,
} from '@elastic/elasticsearch/lib/api/types';
import { Indices, indices, resolveIndex } from './indices';
import esClient from './client';
import mappings, {
  VideoSessionDocument,
  LiveSessionDocument,
  CategoryDocument,
} from './mapping';
import { PublicVideoSession } from '../../types/contracts/video-session';
import { PublicCategory } from '../../types/contracts/category';
import prismaClient from '../../database/clients/prisma';

type DocumentTypeMap = {
  video_session: VideoSessionDocument;
  live_session: LiveSessionDocument;
  category: CategoryDocument;
};

class ElasticEngine<T extends Indices> {
  constructor(
    private readonly client: Client,
    private readonly index: T
  ) {}

  get resolvedIndex() {
    return resolveIndex(this.index);
  }

  async findUnique(id: string) {
    const res = await this.client.get<DocumentTypeMap[T]>({
      index: this.resolvedIndex,
      id,
    });

    return res;
  }

  async createDocument(document: DocumentTypeMap[T], refresh: boolean = true) {
    const isExist = await this.client.exists({
      index: this.resolvedIndex,
      id: document.id,
    });

    if (isExist) {
      throw new Error(
        `Document with id ${document.id} already exists in index ${this.resolvedIndex}`
      );
    }

    const res = await this.client.index({
      index: this.resolvedIndex,
      id: document.id,
      document,
      refresh,
    });

    if (res.result !== 'created') {
      throw new Error(
        `Failed to create document in index ${this.resolvedIndex} with id ${document.id}`
      );
    }

    return res;
  }

  async updateDocument(document: DocumentTypeMap[T], refresh: boolean = true) {
    const isExist = await this.client.exists({
      index: this.resolvedIndex,
      id: document.id,
    });

    if (!isExist) {
      throw new Error(
        `Document with id ${document.id} does not exist in index ${this.resolvedIndex}`
      );
    }

    const res = await this.client.update({
      index: this.resolvedIndex,
      id: document.id,
      doc: document,
      refresh,
    });

    if (res.result !== 'updated' && res.result !== 'noop') {
      throw new Error(
        `Failed to update document in index ${this.resolvedIndex} with id ${document.id}`
      );
    }

    return res;
  }

  async deleteDocument(id: string, refresh: boolean = true) {
    return await this.client.delete({
      index: this.resolvedIndex,
      id,
      refresh,
    });
  }

  async searchDocument(
    searchParams: Omit<SearchRequest, 'index'> & { index?: string } = {}
  ) {
    const result = await this.client.search<DocumentTypeMap[T]>({
      index: this.resolvedIndex,
      ...searchParams,
    });

    return result;
  }

  async bulkDocument(req: BulkRequest, refresh: boolean = true) {
    return await this.client.bulk({ ...req, refresh });
  }

  async deleteByQuery(query: DeleteByQueryRequest) {
    return await this.client.deleteByQuery(query);
  }
}

class VideoSessionModel {
  private esEngine: ElasticEngine<'video_session'>;

  constructor(esClient: Client) {
    this.esEngine = new ElasticEngine(esClient, 'video_session');
  }

  private async convertToDocument(
    videoSession: PublicVideoSession
  ): Promise<VideoSessionDocument> {
    const document: VideoSessionDocument = {
      id: videoSession.id,
      title: videoSession.title,
      description: videoSession.description,
      break_time: videoSession.break_time,
      category: videoSession.category?.label,
      organizer: {
        id: videoSession.organizer.id,
        username: videoSession.organizer.username,
      },
      access_level: videoSession.access_level,
      created_at: videoSession.created_at,
      allowed_list: [],
    };
    if (videoSession.access_level === 'PRIVATE') {
      const allowedUserIds = await prismaClient.video_session_allow.findMany({
        where: { video_session_id: videoSession.id },
        select: { user_id: true },
      });

      document.allowed_list = allowedUserIds.map((entry) => entry.user_id);
    }

    return document;
  }

  async find(id: string): Promise<VideoSessionDocument | undefined> {
    const findUniqueRes = await this.esEngine.findUnique(id);

    return findUniqueRes._source;
  }

  async findMany(ids: string[]): Promise<VideoSessionDocument[]> {
    const result: VideoSessionDocument[] = [];
    const searchRes = await this.esEngine.searchDocument({
      query: {
        ids: {
          values: ids,
        },
      },
    });

    for (const hit of searchRes.hits.hits) {
      if (hit._source) {
        result.push(hit._source);
      }
    }

    return result;
  }

  async create(
    videoSession: PublicVideoSession
  ): Promise<VideoSessionDocument> {
    const createRes = await this.esEngine.createDocument(
      await this.convertToDocument(videoSession),
      true
    );

    const createdDocument = await this.find(createRes._id);

    if (!createdDocument) {
      throw new Error(
        `Document with id ${createRes._id} not found in index ${this.esEngine.resolvedIndex} after creation`
      );
    }

    return createdDocument;
  }

  async createMany(
    videoSessions: PublicVideoSession[]
  ): Promise<VideoSessionDocument[]> {
    const documents = await Promise.all(
      videoSessions.map((session) => this.convertToDocument(session))
    );

    const bulkOps: BulkRequest['operations'] = videoSessions.flatMap(
      (videoSession, index) => [
        {
          index: { _index: this.esEngine.resolvedIndex, _id: videoSession.id },
        },
        documents[index],
      ]
    );

    const createManyRes = await this.esEngine.bulkDocument({
      operations: bulkOps,
    });

    if (createManyRes.errors) {
      throw new Error(
        `Failed to create some documents in index ${this.esEngine.resolvedIndex}`
      );
    }

    const createdIds: string[] = [];

    for (const [index, item] of createManyRes.items.entries()) {
      const createRes = item.index;

      if (!createRes || createRes.status !== 201 || !createRes._id) {
        throw new Error(
          `Failed to create document with id ${videoSessions[index].id}: ${createRes?.error?.reason ?? 'Unknown error'}`
        );
      }

      createdIds.push(createRes._id);
    }

    return await this.findMany(createdIds);
  }

  async update(videoSession: PublicVideoSession) {
    const updateRes = await this.esEngine.updateDocument(
      await this.convertToDocument(videoSession),
      true
    );

    return await this.find(updateRes._id);
  }

  async search(searchParams: Omit<SearchRequest, 'index'>) {
    const searchRes = await this.esEngine.searchDocument(searchParams);

    const documents = searchRes.hits.hits
      .map((hit) => hit._source)
      .filter((doc): doc is VideoSessionDocument => doc !== undefined);

    return documents;
  }

  async delete(id: string) {
    try {
      await this.esEngine.deleteDocument(id, true);
    } catch (err: any) {
      // document를 찾지 못했으면 굳이 에러를 throw하지 않는다.
      if (err.meta?.statusCode == 404) {
        return;
      }

      throw err;
    }

    return;
  }

  async deleteMany(ids?: string[]) {
    if (!ids || ids.length === 0) {
      return await this.esEngine.deleteByQuery({
        index: this.esEngine.resolvedIndex,
        refresh: true,
        query: { match_all: {} },
      });
    }

    const bulkOps: BulkRequest['operations'] = ids.flatMap((docId) => [
      { delete: { _index: this.esEngine.resolvedIndex, _id: docId } },
    ]);

    const deleteManyRes = await this.esEngine.bulkDocument({
      operations: bulkOps,
    });

    for (const [index, item] of deleteManyRes.items.entries()) {
      const deleteRes = item.delete;

      if (
        !deleteRes ||
        (deleteRes.status !== 200 && deleteRes.status !== 404)
      ) {
        throw deleteRes?.error;
      }
    }

    return deleteManyRes;
  }
}

class LiveSessionModel {
  private esEngine: ElasticEngine<'live_session'>;

  constructor(esClient: Client) {
    this.esEngine = new ElasticEngine(esClient, 'live_session');
  }
}

class CategoryModel {
  private esEngine: ElasticEngine<'category'>;

  constructor(esClient: Client) {
    this.esEngine = new ElasticEngine(esClient, 'category');
  }

  private convertToDocument(category: PublicCategory): CategoryDocument {
    return {
      id: category.label,
      label: category.label,
    };
  }

  async find(id: string): Promise<CategoryDocument | undefined> {
    const findUniqueRes = await this.esEngine.findUnique(id);

    return findUniqueRes._source;
  }

  async findMany(ids: string[]): Promise<CategoryDocument[]> {
    const result: CategoryDocument[] = [];
    const searchRes = await this.esEngine.searchDocument({
      query: {
        ids: {
          values: ids,
        },
      },
    });

    for (const hit of searchRes.hits.hits) {
      if (hit._source) {
        result.push(hit._source);
      }
    }

    return result;
  }

  async create(category: PublicCategory): Promise<CategoryDocument> {
    const createRes = await this.esEngine.createDocument(
      this.convertToDocument(category),
      true
    );

    const createdDocument = await this.find(createRes._id);

    if (!createdDocument) {
      throw new Error(
        `Document with id ${createRes._id} not found in index ${this.esEngine.resolvedIndex} after creation`
      );
    }

    return createdDocument;
  }

  async createMany(categories: PublicCategory[]): Promise<CategoryDocument[]> {
    const bulkOps: BulkRequest['operations'] = categories.flatMap(
      (category) => [
        { index: { _index: this.esEngine.resolvedIndex, _id: category.label } },
        this.convertToDocument(category),
      ]
    );

    const createManyRes = await this.esEngine.bulkDocument({
      operations: bulkOps,
    });

    if (createManyRes.errors) {
      throw new Error(
        `Failed to create some documents in index ${this.esEngine.resolvedIndex}`
      );
    }

    return await this.findMany(categories.map((category) => category.label));
  }

  async update(category: PublicCategory) {
    const updateRes = await this.esEngine.updateDocument(
      this.convertToDocument(category),
      true
    );

    return await this.find(updateRes._id);
  }

  async search(searchParams: Omit<SearchRequest, 'index'>) {
    const searchRes = await this.esEngine.searchDocument(searchParams);

    const documents = searchRes.hits.hits
      .map((hit) => hit._source)
      .filter((doc): doc is CategoryDocument => doc !== undefined);

    return documents;
  }

  async delete(id: string) {
    try {
      await this.esEngine.deleteDocument(id, true);
    } catch (err: any) {
      // document를 찾지 못했으면 굳이 에러를 throw하지 않는다.
      if (err.meta?.statusCode == 404) {
        return;
      }

      throw err;
    }

    return;
  }

  async deleteMany(ids?: string[]) {
    if (!ids || ids.length === 0) {
      return await this.esEngine.deleteByQuery({
        index: this.esEngine.resolvedIndex,
        refresh: true,
        query: { match_all: {} },
      });
    }

    const bulkOps: BulkRequest['operations'] = ids.flatMap((docId) => [
      { delete: { _index: this.esEngine.resolvedIndex, _id: docId } },
    ]);

    const deleteManyRes = await this.esEngine.bulkDocument({
      operations: bulkOps,
    });

    for (const [index, item] of deleteManyRes.items.entries()) {
      const deleteRes = item.delete;

      if (
        !deleteRes ||
        (deleteRes.status !== 200 && deleteRes.status !== 404)
      ) {
        throw deleteRes?.error;
      }
    }

    return deleteManyRes;
  }
}

class ES {
  esClient: Client;
  initalized: boolean;

  video_session: VideoSessionModel;
  live_session: LiveSessionModel;
  category: CategoryModel;

  constructor() {
    this.esClient = esClient;
    this.initalized = false;

    this.video_session = new VideoSessionModel(this.esClient);
    this.live_session = new LiveSessionModel(this.esClient);
    this.category = new CategoryModel(this.esClient);
  }

  async init() {
    for (const index of indices) {
      const indexName = resolveIndex(index);
      let isExist = await esClient.indices.exists({ index: indexName });

      if (!isExist) {
        await esClient.indices.create({
          index: indexName,
          mappings: mappings[index],
        });
      }
    }

    this.initalized = true;
    console.log('SearchService initialized');
  }
}

const es = new ES();

export default es;
