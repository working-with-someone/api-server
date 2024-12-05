import prismaClient from '../database/clients/prisma';
import { wwsError } from '../utils/wwsError';
import httpStatusCode from 'http-status-codes';

export async function getCategories() {
  const categories = await prismaClient.category.findMany({});

  return categories;
}
