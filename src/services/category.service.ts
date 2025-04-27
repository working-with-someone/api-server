import prismaClient from '../database/clients/prisma';
import type { GetCategoriesInput } from './category.service.d';

export async function getCategories(data: GetCategoriesInput) {
  const categories = await prismaClient.category.findMany({
    skip: (data.page - 1) * data.per_page,
    take: data.per_page,
  });

  return categories;
}
