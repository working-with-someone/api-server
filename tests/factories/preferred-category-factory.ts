import { PrismaClient, preferred_category } from '@prisma/client';
import { IFactory } from './factory';
const prisma = new PrismaClient();
import { CreatePreferredCategoryInput } from '../../src/services/preferred_category.service.d';
import { preferredCategoryService } from '../../src/services';

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

  async cleanup(): Promise<void> {
    await prisma.preferred_category.deleteMany({});
  }
}

const preferredCategoryFactory = new PreferredCategoryFactory();

export default preferredCategoryFactory;
