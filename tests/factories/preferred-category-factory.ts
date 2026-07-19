import { Prisma, preferred_category } from '../../prisma/generated/prisma/client';
import { IFactory } from './factory';
import { CreatePreferredCategoryInput } from '../../src/services/preferred_category.service.d';
import { preferredCategoryService } from '../../src/services';
import prismaClient from '../../src/database/clients/prisma';

const prisma = prismaClient;

class PreferredCategoryFactory
  implements IFactory<CreatePreferredCategoryInput, preferred_category>
{
  create(data: CreatePreferredCategoryInput) {
    return {
      user_id: data.user_id,
      category_label: data.category_label,
    };
  }

  async createAndSave(
    data: CreatePreferredCategoryInput
  ): Promise<preferred_category> {
    return await preferredCategoryService.createPreferredCategory(
      this.create(data)
    );
  }

  async delete(where: Prisma.preferred_categoryWhereInput): Promise<void> {
    await prisma.preferred_category.deleteMany({ where });
  }

  async deleteMany(where: Prisma.preferred_categoryWhereInput): Promise<void> {
    await prisma.preferred_category.deleteMany({ where });
  }

  async cleanup(): Promise<void> {
    await prisma.preferred_category.deleteMany({});
  }
}

const preferredCategoryFactory = new PreferredCategoryFactory();

export default preferredCategoryFactory;

