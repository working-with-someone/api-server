import prismaClient from '../database/clients/prisma';
import { wwsError } from '../utils/wwsError';
import httpStatusCode from 'http-status-codes';
import type {
  GetPreferredCategoriesInput,
  CreatePreferredCategoryInput,
  DeletePreferredCategoryInput,
} from './preferred_category.service.d';

export async function getPreferredCategories(
  data: GetPreferredCategoriesInput
) {
  const preferredCategories = await prismaClient.preferred_category.findMany({
    where: { user_id: data.userId },
    include: { category: true },
  });

  return preferredCategories.map((r) => r.category);
}

export async function createPreferredCategory(
  data: CreatePreferredCategoryInput
) {
  const exists = await prismaClient.preferred_category.findUnique({
    where: {
      user_id_category_label: {
        user_id: data.user_id,
        category_label: data.category_label,
      },
    },
  });

  // Check if the user has already reached the preferred category limit (20)
  const preferredCategoryCount = await prismaClient.preferred_category.count({
    where: { user_id: data.user_id },
  });

  if (preferredCategoryCount >= 20) {
    throw new wwsError(
      httpStatusCode.BAD_REQUEST,
      'preferred category limit exceeded'
    );
  }

  if (exists) {
    throw new wwsError(
      httpStatusCode.CONFLICT,
      'preferred category already exists'
    );
  }

  const createdPreferredCategory = await prismaClient.preferred_category.create(
    {
      data: {
        ...data,
        priority: preferredCategoryCount,
      },
    }
  );

  return createdPreferredCategory;
}

export async function deletePreferredCategory(
  data: DeletePreferredCategoryInput
) {
  await prismaClient.preferred_category.delete({
    where: { user_id_category_label: data },
  });

  return;
}
