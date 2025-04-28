import prismaClient from '../database/clients/prisma';
import type { GetCategoriesInput } from './category.service.d';

const sortOptions: Record<string, any> = {
  live_session_count: { live_session: { _count: 'desc' } },
  video_session_count: { video_session: { _count: 'desc' } },
  created_at: { created_at: 'desc' },
};

export async function getCategories(data: GetCategoriesInput) {
  const orderBy = sortOptions[data.sort] ?? undefined;

  const categories = await prismaClient.category.findMany({
    skip: (data.page - 1) * data.per_page,
    take: data.per_page,
    orderBy,
    include: {
      _count: {
        select: {
          live_session: true,
          video_session: true,
        },
      },
    },
  });

  return categories;
}
