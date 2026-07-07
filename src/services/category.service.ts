import prismaClient from '../database/clients/prisma';
import { PublicCategory } from '../types/contracts/category';
import { PaginatedResult } from '../types/pagination';
import { buildPagenationMeta } from '../utils/pagination';
import type { GetCategoriesInput } from './category.service.d';

const sortOptions: Record<string, any> = {
  live_session_count: { live_session: { _count: 'desc' } },
  video_session_count: { video_session: { _count: 'desc' } },
  created_at: { created_at: 'desc' },
};

export async function getCategories(
  data: GetCategoriesInput
): Promise<PaginatedResult<PublicCategory[], 'categories'>> {
  const orderBy = sortOptions[data.sort] ?? undefined;

  const categories = await prismaClient.category.findMany({
    skip: (data.page - 1) * data.per_page,
    take: data.per_page + 1,
    orderBy,
  });

  const pagination = buildPagenationMeta(categories, data.page, data.per_page);

  if (pagination.hasMore) {
    categories.pop();
  }

  return {
    categories,
    pagination,
  };
}
