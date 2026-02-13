import { faker } from '@faker-js/faker';
import { Prisma, PrismaClient, preferred_category } from '@prisma/client';
import { IFactory } from './factory';
const prisma = new PrismaClient();

type PreferredCategoryCreateInput = Prisma.preferred_categoryCreateInput;

class PreferredCategoryFactory
  implements IFactory<PreferredCategoryCreateInput, preferred_category>
{
  create(overrides: PreferredCategoryCreateInput) {
    const data: PreferredCategoryCreateInput = {
      user: overrides.user,
      category: overrides.category,
    };

    return data;
  }

  async createAndSave(
    overrides: PreferredCategoryCreateInput
  ): Promise<preferred_category> {
    const data = this.create(overrides);

    return await prisma.preferred_category.create({
      data,
    });
  }

  async cleanup(): Promise<void> {
    await prisma.preferred_category.deleteMany({});
  }
}

const preferredCategoryFactory = new PreferredCategoryFactory();

export default preferredCategoryFactory;
