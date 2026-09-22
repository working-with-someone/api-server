import prismaClient from '../database/clients/prisma';
import es from '../lib/search';
import { PublicCategory } from '../types/contracts/category';
import { PaginatedResult } from '../types/pagination';
import { buildPaginationMeta } from '../utils/pagination';
import type { GetCategoriesInput } from './category.service.d';

const sortOptions: Record<string, any> = {
  live_session_count: { live_session: { _count: 'desc' } },
  video_session_count: { video_session: { _count: 'desc' } },
  created_at: { created_at: 'desc' },
};

async function getCategoriesBySearch(
  data: GetCategoriesInput & { search: string }
): Promise<PaginatedResult<PublicCategory[], 'categories'>> {
  console.log({
    from: (data.page - 1) * data.per_page,
    size: data.per_page + 1,
    query: {
      multi_match: {
        query: data.search,
        fields: ['label'],
      },
    },
  });
  const documents = await es.category.search({
    from: (data.page - 1) * data.per_page,
    size: data.per_page + 1,
    query: {
      multi_match: {
        query: data.search,
        fields: ['label'],
      },
    },
  });

  const labels = documents.map((doc) => doc.label);

  const categoriesFromDb = await prismaClient.category.findMany({
    where: { label: { in: labels } },
  });

  const categoryMap = new Map(
    categoriesFromDb.map((category) => [category.label, category])
  );

  // ES 검색 결과의 순서(관련도순)를 유지한다.
  const categories = labels
    .map((label) => categoryMap.get(label))
    .filter((category): category is PublicCategory => category !== undefined);

  const pagination = buildPaginationMeta(categories, data.page, data.per_page);

  if (pagination.hasMore) {
    categories.pop();
  }

  return {
    categories,
    pagination,
  };
}

export async function getCategories(
  data: GetCategoriesInput
): Promise<PaginatedResult<PublicCategory[], 'categories'>> {
  const search = data.search;

  if (search) {
    return getCategoriesBySearch({ ...data, search });
  }

  const orderBy = sortOptions[data.sort] ?? undefined;

  const categories = await prismaClient.category.findMany({
    skip: (data.page - 1) * data.per_page,
    take: data.per_page + 1,
    orderBy,
  });

  const pagination = buildPaginationMeta(categories, data.page, data.per_page);

  if (pagination.hasMore) {
    categories.pop();
  }

  return {
    categories,
    pagination,
  };
}
