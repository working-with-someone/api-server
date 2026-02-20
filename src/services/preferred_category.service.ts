import prismaClient from '../database/clients/prisma';
import { wwsError } from '../utils/wwsError';
import httpStatusCode from 'http-status-codes';
import type {
  GetPreferredCategoriesInput,
  CreatePreferredCategoryInput,
  DeletePreferredCategoryInput,
  UpdatePreferredCategoryPriorityInput,
} from './preferred_category.service.d';

export async function getPreferredCategories(
  data: GetPreferredCategoriesInput
) {
  const preferredCategories = await prismaClient.preferred_category.findMany({
    where: { user_id: data.userId },
    orderBy: { priority: 'asc' },
  });

  return preferredCategories;
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

export async function updatePreferredCategoryPriority(
  data: UpdatePreferredCategoryPriorityInput
) {
  const targetPreferredCategory =
    await prismaClient.preferred_category.findUnique({
      where: {
        user_id_category_label: {
          user_id: data.user_id,
          category_label: data.category_label,
        },
      },
    });

  if (!targetPreferredCategory) {
    throw new wwsError(
      httpStatusCode.NOT_FOUND,
      'preferred category not found'
    );
  }

  const currPriority = targetPreferredCategory.priority;
  const newPriority = data.priority;
  const preferredCategoryCount = await prismaClient.preferred_category.count({
    where: { user_id: data.user_id },
  });

  if (newPriority == currPriority) {
    return targetPreferredCategory;
  }

  const lastPriority = preferredCategoryCount - 1;

  if (newPriority > lastPriority) {
    throw new wwsError(
      httpStatusCode.BAD_REQUEST,
      'priority exceeds the number of preferred categories'
    );
  }

  await prismaClient.$transaction(async (tx) => {
    if (newPriority < currPriority) {
      await tx.preferred_category.updateMany({
        where: {
          user_id: data.user_id,
          priority: {
            gte: newPriority,
            lt: currPriority,
          },
        },
        data: {
          priority: { increment: 1 },
        },
      });
    } else if (newPriority > currPriority) {
      await tx.preferred_category.updateMany({
        where: {
          user_id: data.user_id,
          priority: {
            lte: newPriority,
            gt: currPriority,
          },
        },
        data: {
          priority: { decrement: 1 },
        },
      });
    }

    await tx.preferred_category.update({
      where: {
        user_id_category_label: {
          user_id: data.user_id,
          category_label: data.category_label,
        },
      },
      data: { priority: newPriority },
    });
  });

  const updatedPreferredCategory =
    await prismaClient.preferred_category.findUnique({
      where: {
        user_id_category_label: {
          user_id: data.user_id,
          category_label: data.category_label,
        },
      },
    });

  return updatedPreferredCategory;
}

export async function deletePreferredCategory(
  data: DeletePreferredCategoryInput
) {
  const targetPreferredCategory =
    await prismaClient.preferred_category.findUnique({
      where: {
        user_id_category_label: {
          user_id: data.user_id,
          category_label: data.category_label,
        },
      },
    });

  if (!targetPreferredCategory) {
    throw new wwsError(
      httpStatusCode.NOT_FOUND,
      'preferred category not found'
    );
  }

  await prismaClient.$transaction(async (tx) => {
    await tx.preferred_category.delete({
      where: { user_id_category_label: data },
    });

    await tx.preferred_category.updateMany({
      where: {
        user_id: data.user_id,
        priority: { gt: targetPreferredCategory.priority },
      },
      data: {
        priority: { decrement: 1 },
      },
    });
  });

  return;
}
