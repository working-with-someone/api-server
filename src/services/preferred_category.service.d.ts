export interface GetPreferredCategoriesInput {
  userId: number;
}

export interface CreatePreferredCategoryInput {
  user_id: number;
  category_label: string;
}

export type DeletePreferredCategoryInput = CreatePreferredCategoryInput;
