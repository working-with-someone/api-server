import { faker } from '@faker-js/faker';
import { Prisma, category } from '../../prisma/generated/prisma/client';
import { IFactory } from './factory';
import prismaClient from '../../src/database/clients/prisma';

const prisma = prismaClient;

type CategoryCreateInput = Prisma.categoryCreateInput;

class CategoryFactory implements IFactory<CategoryCreateInput, category> {
  /**
   * ?⑥씪 ?쒕뜡 移댄뀒怨좊━ ?앹꽦 (DB????ν븯吏 ?딆쓬)
   * @param overrides - ?ㅻ쾭?쇱씠?쒗븷 ?꾨뱶 媛?
   * @returns ?앹꽦??移댄뀒怨좊━ 媛앹껜
   */
  create(overrides?: Partial<CategoryCreateInput>): CategoryCreateInput {
    const label = overrides?.label || faker.string.uuid();

    const categoryData: CategoryCreateInput = {
      label,
    };

    return categoryData;
  }

  /**
   * ?⑥씪 ?쒕뜡 移댄뀒怨좊━ ?앹꽦 諛?DB?????
   * @param overrides - ?ㅻ쾭?쇱씠?쒗븷 ?꾨뱶 媛?
   * @returns ??λ맂 移댄뀒怨좊━ 媛앹껜 (DB?먯꽌 諛섑솚??媛?
   */
  async createAndSave(
    overrides?: Partial<CategoryCreateInput>
  ): Promise<category> {
    const categoryData = this.create(overrides);

    const savedCategory = await prisma.category.create({
      data: categoryData,
    });

    return savedCategory;
  }

  /**
   * ?щ윭 媛쒖쓽 ?쒕뜡 移댄뀒怨좊━ ?앹꽦 (DB????ν븯吏 ?딆쓬)
   * @param options - ?ㅻ쾭?쇱씠???꾨뱶 媛?諛??앹꽦 媛쒖닔
   * @returns ?앹꽦??移댄뀒怨좊━ 媛앹껜 諛곗뿴
   */
  createMany(options?: {
    overrides?: Partial<CategoryCreateInput>;
    count?: number;
  }): CategoryCreateInput[] {
    const { overrides = {}, count = 1 } = options ?? {};
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * ?щ윭 媛쒖쓽 ?쒕뜡 移댄뀒怨좊━ ?앹꽦 諛?DB?????
   * @param options - ?ㅻ쾭?쇱씠???꾨뱶 媛?諛??앹꽦 媛쒖닔
   * @returns ??λ맂 移댄뀒怨좊━ 媛앹껜 諛곗뿴
   */
  async createManyAndSave(options?: {
    overrides?: Partial<CategoryCreateInput>;
    count?: number;
  }): Promise<category[]> {
    const { overrides = {}, count = 1 } = options ?? {};
    const categoriesData = this.createMany({ overrides, count });

    const savedCategories: category[] = [];
    for (const categoryData of categoriesData) {
      const savedCategory = await prisma.category.create({
        data: categoryData,
      });
      savedCategories.push(savedCategory);
    }

    return savedCategories;
  }

  async delete(where: Prisma.categoryWhereInput): Promise<void> {
    await prisma.category.deleteMany({ where });
  }

  async deleteMany(where: Prisma.categoryWhereInput): Promise<void> {
    await prisma.category.deleteMany({ where });
  }

  async cleanup(): Promise<void> {
    await prisma.category.deleteMany({});
  }
}

const categoryFactory = new CategoryFactory();

export default categoryFactory;

