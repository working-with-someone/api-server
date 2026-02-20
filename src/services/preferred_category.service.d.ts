export interface GetPreferredCategoriesInput {
  userId: number;
}

export interface CreatePreferredCategoryInput {
  user_id: number;
  category_label: string;
}

export interface UpdatePreferredCategoryPriorityInput {
  user_id: number;
  category_label: string;
  priority: number;
}

export type DeletePreferredCategoryInput = CreatePreferredCategoryInput;
