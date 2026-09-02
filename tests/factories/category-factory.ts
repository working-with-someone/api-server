import { faker } from '@faker-js/faker';
import { Prisma, category } from '../../prisma/generated/prisma/client';
import { IFactory } from './factory';
import prismaClient from '../../src/database/clients/prisma';

const prisma = prismaClient;

type CategoryCreateInput = Prisma.categoryCreateInput;

class CategoryFactory implements IFactory<CategoryCreateInput, category> {
  /**
   * 단일 랜덤 카테고리 생성 (DB에 저장하지 않음)
   * @param overrides - 오버라이드할 필드 값
   * @returns 생성된 카테고리 객체
   */
  create(overrides?: Partial<CategoryCreateInput>): CategoryCreateInput {
    const label = overrides?.label || faker.string.uuid();

    const categoryData: CategoryCreateInput = {
      label,
    };

    return categoryData;
  }

  /**
   * 단일 랜덤 카테고리 생성 및 DB에 저장
   * @param overrides - 오버라이드할 필드 값
   * @returns 저장된 카테고리 객체 (DB에서 반환된 값)
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
   * 여러 개의 랜덤 카테고리 생성 (DB에 저장하지 않음)
   * @param options - 오버라이드 필드 값 및 생성 개수
   * @returns 생성된 카테고리 객체 배열
   */
  createMany(options?: {
    overrides?: Partial<CategoryCreateInput>;
    count?: number;
  }): CategoryCreateInput[] {
    const { overrides = {}, count = 1 } = options ?? {};
    return Array.from({ length: count }, () => this.create(overrides));
  }

  /**
   * 여러 개의 랜덤 카테고리 생성 및 DB에 저장
   * @param options - 오버라이드 필드 값 및 생성 개수
   * @returns 저장된 카테고리 객체 배열
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

